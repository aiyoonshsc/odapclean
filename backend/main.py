from fastapi import FastAPI, HTTPException, Depends, status, File, UploadFile, Form
import uuid
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from typing import List, Optional
import os
from datetime import datetime, timedelta
from dotenv import load_dotenv
from supabase import create_client, Client
from passlib.context import CryptContext
from jose import JWTError, jwt
import models
from utils.image_processing import auto_crop_image, detect_document_bounds
from fastapi.responses import Response, JSONResponse

load_dotenv()

app = FastAPI()

# Ensure Storage Bucket Exists
@app.on_event("startup")
async def startup_event():
    try:
        # Check if 'problems' bucket exists
        buckets = supabase.storage.list_buckets()
        bucket_names = [b.name for b in buckets]
        
        if "problems" not in bucket_names:
            print("Creating 'problems' bucket...")
            supabase.storage.create_bucket("problems", options={"public": True})
            print("Created 'problems' bucket successfully.")
    except Exception as e:
        print(f"Warning: Failed to initialize storage bucket automatically. Please run 'backend/db/create_storage_bucket.sql' in Supabase SQL Editor. Error: {e}")

# CORS
origins = ["*"]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Supabase Client
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key)

# --- Auth Configuration ---
SECRET_KEY = os.environ.get("SECRET_KEY", "09d25e094faa6ca2556c818166b7a9563b93f7099f6f0f4caa6cf63b88e8d3e7")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = 30

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="api/v1/token")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=15)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            raise credentials_exception
        token_data = models.TokenData(username=username)
    except JWTError:
        raise credentials_exception
    
    # Fetch user from DB
    response = supabase.table('users').select("*").eq('username', token_data.username).single().execute()
    if not response.data:
        raise credentials_exception
    user = models.User(**response.data)
    return user

@app.post("/api/v1/utils/auto-crop")
async def api_auto_crop(file: UploadFile = File(...)):
    try:
        file_data = await file.read()
        # Instead of returning processed image, return the bounding box
        bounds = detect_document_bounds(file_data)
        return JSONResponse(content=bounds)
    except Exception as e:
        print(f"Auto crop error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# --- Auth Endpoints ---

@app.post("/api/v1/register", response_model=models.User)
def register(user: models.UserCreate):
    existing = supabase.table('users').select("user_id").eq('username', user.username).execute()
    if existing.data:
        raise HTTPException(status_code=400, detail="Username already registered")
    
    hashed_password = get_password_hash(user.password)
    user_data = {
        "username": user.username,
        "email": user.email,
        "hashed_password": hashed_password
    }
    response = supabase.table('users').insert(user_data).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Registration failed")
    
    return response.data[0]

@app.post("/api/v1/token", response_model=models.Token)
def login_for_access_token(form_data: OAuth2PasswordRequestForm = Depends()):
    response = supabase.table('users').select("*").eq('username', form_data.username).single().execute()
    if not response.data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    user_dict = response.data
    if not verify_password(form_data.password, user_dict['hashed_password']):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user_dict['username']}, expires_delta=access_token_expires
    )
    return {"access_token": access_token, "token_type": "bearer"}

# --- Folder Endpoints ---

@app.get("/api/v1/folders", response_model=List[models.Folder])
def get_folders(current_user: models.User = Depends(get_current_user)):
    response = supabase.table('folders').select("*").eq('user_id', current_user.user_id).order('sort_order', desc=False).order('created_at', desc=True).execute()
    return response.data

@app.put("/api/v1/folders/reorder")
def reorder_folders(items: List[models.FolderReorderItem], current_user: models.User = Depends(get_current_user)):
    for item in items:
        supabase.table('folders').update({"sort_order": item.sort_order}).eq('folder_id', item.folder_id).eq('user_id', current_user.user_id).execute()
    return {"message": "Folders reordered"}

@app.post("/api/v1/folders", response_model=models.Folder)
def create_folder(folder: models.FolderCreate, current_user: models.User = Depends(get_current_user)):
    folder_data = folder.model_dump()
    folder_data['user_id'] = current_user.user_id
    response = supabase.table('folders').insert(folder_data).execute()
    return response.data[0]

@app.put("/api/v1/folders/{folder_id}", response_model=models.Folder)
def update_folder(folder_id: int, folder: models.FolderCreate, current_user: models.User = Depends(get_current_user)):
    update_data = folder.model_dump(exclude_unset=True)
    # Don't allow changing user_id
    if 'user_id' in update_data:
        del update_data['user_id']
        
    response = supabase.table('folders').update(update_data).eq('folder_id', folder_id).eq('user_id', current_user.user_id).execute()
    if not response.data:
         raise HTTPException(status_code=404, detail="Folder not found")
    return response.data[0]

@app.delete("/api/v1/folders/{folder_id}")
def delete_folder(folder_id: int, current_user: models.User = Depends(get_current_user)):
    response = supabase.table('folders').delete().eq('folder_id', folder_id).eq('user_id', current_user.user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Folder not found")
    return {"message": "Folder deleted"}

# --- Curriculum Endpoints ---

@app.get("/api/v1/curriculums", response_model=List[models.Curriculum])
def get_curriculums(current_user: models.User = Depends(get_current_user)):
    response = supabase.table('curriculums').select("*").order('sort_order').execute()
    return response.data

@app.put("/api/v1/curriculums/reorder")
def reorder_curriculums(items: List[models.CurriculumReorderItem], current_user: models.User = Depends(get_current_user)):
    for item in items:
        supabase.table('curriculums').update({"sort_order": item.sort_order}).eq('curriculum_id', item.curriculum_id).execute()
    return {"message": "Curriculums reordered"}

@app.post("/api/v1/curriculums", response_model=models.Curriculum)
def create_curriculum(curriculum: models.CurriculumCreate, current_user: models.User = Depends(get_current_user)):
    response = supabase.table('curriculums').insert(curriculum.model_dump()).execute()
    return response.data[0]

@app.put("/api/v1/curriculums/{curriculum_id}", response_model=models.Curriculum)
def update_curriculum(curriculum_id: int, curriculum: models.CurriculumCreate, current_user: models.User = Depends(get_current_user)):
    response = supabase.table('curriculums').update(curriculum.model_dump(exclude_unset=True)).eq('curriculum_id', curriculum_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Curriculum not found")
    return response.data[0]

@app.delete("/api/v1/curriculums/{curriculum_id}")
def delete_curriculum(curriculum_id: int, current_user: models.User = Depends(get_current_user)):
    response = supabase.table('curriculums').delete().eq('curriculum_id', curriculum_id).execute()
    if not response.data:
         raise HTTPException(status_code=404, detail="Curriculum not found")
    return {"message": "Curriculum deleted"}

# --- Problem Endpoints ---

@app.get("/api/v1/problems", response_model=List[models.ProblemListResponse])
def get_problems(
    status: str = 'all', 
    folder_id: Optional[int] = None, 
    curriculum_id: Optional[int] = None,
    sort_by: str = 'date_desc',
    current_user: models.User = Depends(get_current_user)
):
    query = supabase.table('problems').select("*").eq('user_id', current_user.user_id)
    
    if folder_id:
        query = query.eq('folder_id', folder_id)
    if curriculum_id:
        # Hierarchical filtering: Get all descendants
        all_curriculums = supabase.table('curriculums').select("curriculum_id, parent_id").execute().data
        
        target_ids = {curriculum_id}
        current_level_ids = {curriculum_id}
        
        while current_level_ids:
            next_level_ids = set()
            for c in all_curriculums:
                if c['parent_id'] in current_level_ids:
                    next_level_ids.add(c['curriculum_id'])
            
            if not next_level_ids:
                break
                
            target_ids.update(next_level_ids)
            current_level_ids = next_level_ids
            
        query = query.in_('curriculum_id', list(target_ids))
        
    response = query.execute()
    problems = response.data
    
    # Fetch logs for stats
    log_response = supabase.table('solve_logs').select("problem_id, is_correct, created_at").eq('user_id', current_user.user_id).order('created_at', desc=True).execute()
    logs = log_response.data
    
    problem_stats = {}
    
    for log in logs:
        pid = log['problem_id']
        if pid not in problem_stats:
            # Since logs are ordered by created_at desc, the first one encountered is the latest
            problem_stats[pid] = {
                "solve_count": 0,
                "correct_count": 0,
                "latest_status": "correct" if log['is_correct'] else "wrong"
            }
        
        problem_stats[pid]["solve_count"] += 1
        if log['is_correct']:
            problem_stats[pid]["correct_count"] += 1
            
    final_list = []
    for p in problems:
        pid = p['problem_id']
        stat = problem_stats.get(pid, {
            "solve_count": 0,
            "correct_count": 0,
            "latest_status": "not_attempted"
        })
        
        # Calculate correct rate
        if stat["solve_count"] > 0:
            correct_rate = (stat["correct_count"] / stat["solve_count"]) * 100
        else:
            correct_rate = 0.0
            
        p_with_stats = models.ProblemListResponse(
            **p,
            solve_count=stat["solve_count"],
            correct_rate=correct_rate,
            latest_status=stat["latest_status"]
        )
        
        # Filter Logic
        if status == 'not_attempted' and p_with_stats.latest_status != 'not_attempted':
            continue
        if status == 'wrong' and p_with_stats.latest_status != 'wrong':
            continue
        
        final_list.append(p_with_stats)
        
    # Sorting
    if sort_by == 'date_desc':
        final_list.sort(key=lambda x: x.created_at, reverse=True)
    elif sort_by == 'date_asc':
        final_list.sort(key=lambda x: x.created_at)
    elif sort_by == 'solve_count_desc':
        final_list.sort(key=lambda x: x.solve_count, reverse=True)
    elif sort_by == 'title_asc':
        final_list.sort(key=lambda x: x.title)
    elif sort_by == 'order_asc':
        final_list.sort(key=lambda x: x.sort_order)
        
    return final_list

@app.get("/api/v1/statistics", response_model=models.StatisticsResponse)
def get_statistics(current_user: models.User = Depends(get_current_user)):
    # 1. Fetch all problems
    problems_response = supabase.table('problems').select("*").eq('user_id', current_user.user_id).execute()
    problems = problems_response.data
    
    # 2. Fetch all solve logs (latest per problem is enough for status, but for total solves we need all)
    # Actually, let's just fetch all logs to compute accurate stats
    logs_response = supabase.table('solve_logs').select("*").eq('user_id', current_user.user_id).execute()
    logs = logs_response.data
    
    # 3. Fetch folders and curriculums for names
    folders_response = supabase.table('folders').select("*").execute()
    folders = {f['folder_id']: f['name'] for f in folders_response.data}
    
    curriculums_response = supabase.table('curriculums').select("*").execute()
    curriculums = {c['curriculum_id']: c['name'] for c in curriculums_response.data}
    
    # Aggregation Data Structures
    total_problems = len(problems)
    solved_count = 0 # Unique problems solved at least once
    correct_count = 0 # Unique problems solved correctly (latest attempt)
    
    # Map problem_id -> { total_attempts: int, correct_attempts: int, is_solved: bool, is_correct_latest: bool }
    p_stats = {}
    
    # Process logs
    # Sort logs by created_at desc to find latest status
    logs.sort(key=lambda x: x['created_at'], reverse=True)
    
    latest_status_map = {}
    
    for log in logs:
        pid = log['problem_id']
        if pid not in latest_status_map:
            latest_status_map[pid] = log['is_correct']
            
    # Calculate global stats based on problems
    folder_stats = {} # folder_id -> { total, solved, correct }
    curriculum_stats = {} # curriculum_id -> { total, solved, correct }
    
    solved_problems_set = set(log['problem_id'] for log in logs)
    
    correct_problems_set = set()
    for pid, is_correct in latest_status_map.items():
        if is_correct:
            correct_problems_set.add(pid)
            
    solved_count = len(solved_problems_set)
    correct_count = len(correct_problems_set)
    global_correct_rate = (correct_count / solved_count * 100) if solved_count > 0 else 0.0
    
    for p in problems:
        pid = p['problem_id']
        fid = p['folder_id']
        cid = p['curriculum_id']
        
        is_solved = pid in solved_problems_set
        is_correct = pid in correct_problems_set
        
        # Folder Stats
        if fid:
            if fid not in folder_stats:
                folder_stats[fid] = {"total": 0, "solved": 0, "correct": 0}
            folder_stats[fid]["total"] += 1
            if is_solved:
                folder_stats[fid]["solved"] += 1
            if is_correct:
                folder_stats[fid]["correct"] += 1
                
        # Curriculum Stats
        if cid:
            if cid not in curriculum_stats:
                curriculum_stats[cid] = {"total": 0, "solved": 0, "correct": 0}
            curriculum_stats[cid]["total"] += 1
            if is_solved:
                curriculum_stats[cid]["solved"] += 1
            if is_correct:
                curriculum_stats[cid]["correct"] += 1
                
    # Convert to List[StatItem]
    by_folder = []
    for fid, stats in folder_stats.items():
        c_rate = (stats["correct"] / stats["solved"] * 100) if stats["solved"] > 0 else 0.0
        by_folder.append(models.FolderStatItem(
            folder_id=fid,
            name=folders.get(fid, f"Unknown Folder {fid}"),
            total=stats["total"],
            solved=stats["solved"],
            correct=stats["correct"],
            correct_rate=c_rate
        ))
        
    by_curriculum = []
    for cid, stats in curriculum_stats.items():
        c_rate = (stats["correct"] / stats["solved"] * 100) if stats["solved"] > 0 else 0.0
        by_curriculum.append(models.CurriculumStatItem(
            curriculum_id=cid,
            name=curriculums.get(cid, f"Unknown Curriculum {cid}"),
            total=stats["total"],
            solved=stats["solved"],
            correct=stats["correct"],
            correct_rate=c_rate
        ))
        
    return models.StatisticsResponse(
        total_problems=total_problems,
        solved_count=solved_count,
        correct_count=correct_count,
        correct_rate=global_correct_rate,
        by_folder=by_folder,
        by_curriculum=by_curriculum
    )


@app.post("/api/v1/problems", response_model=models.Problem)
async def create_problem(
    title: str = Form(...),
    folder_id: Optional[int] = Form(None),
    curriculum_id: Optional[int] = Form(None),
    hints: str = Form(""),
    content_image: UploadFile = File(...),
    answer_image: UploadFile = File(...),
    current_user: models.User = Depends(get_current_user)
):
    # Helper to upload image to Supabase Storage
    async def upload_image(file: UploadFile) -> str:
        try:
            file_ext = file.filename.split('.')[-1]
            file_name = f"{current_user.user_id}/{uuid.uuid4()}.{file_ext}"
            file_content = await file.read()
            
            # Assuming 'problems' bucket exists
            supabase.storage.from_("problems").upload(
                file_name, 
                file_content, 
                {"content-type": file.content_type}
            )
            
            # Get Public URL
            public_url = supabase.storage.from_("problems").get_public_url(file_name)
            return public_url
        except Exception as e:
            print(f"Upload failed: {e}")
            raise HTTPException(status_code=500, detail=f"Image upload failed: {str(e)}")

    content_url = await upload_image(content_image)
    answer_url = await upload_image(answer_image)

    problem_data = {
        "user_id": current_user.user_id,
        "title": title,
        "folder_id": folder_id,
        "curriculum_id": curriculum_id,
        "problem_image_url": content_url,
        "answer_image_url": answer_url
    }
    
    response = supabase.table('problems').insert(problem_data).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create problem")
    
    new_problem = response.data[0]
    problem_id = new_problem['problem_id']
    
    if hints:
        hint_list = [h.strip() for h in hints.split(',') if h.strip()]
        if hint_list:
            hints_data = [{"problem_id": problem_id, "content": h, "step_number": i+1} for i, h in enumerate(hint_list)]
            supabase.table('hints').insert(hints_data).execute()
        
    return new_problem

@app.put("/api/v1/problems/{problem_id}", response_model=models.Problem)
def update_problem(problem_id: int, problem: models.ProblemUpdate, current_user: models.User = Depends(get_current_user)):
    data = problem.model_dump(exclude_unset=True)
    if not data:
        raise HTTPException(status_code=400, detail="No data to update")
    
    data['updated_by'] = current_user.user_id
    
    response = supabase.table('problems').update(data).eq('problem_id', problem_id).eq('user_id', current_user.user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Problem not found")
    return response.data[0]

@app.delete("/api/v1/problems/{problem_id}")
def delete_problem(problem_id: int, current_user: models.User = Depends(get_current_user)):
    # Hints cascade delete if configured in DB, otherwise delete manually
    supabase.table('hints').delete().eq('problem_id', problem_id).execute()
    
    response = supabase.table('problems').delete().eq('problem_id', problem_id).eq('user_id', current_user.user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Problem not found")
    return {"message": "Problem deleted"}

@app.put("/api/v1/problems/reorder")
def reorder_problems(items: List[models.ProblemReorderItem], current_user: models.User = Depends(get_current_user)):
    for item in items:
        supabase.table('problems').update({"sort_order": item.sort_order}).eq('problem_id', item.problem_id).eq('user_id', current_user.user_id).execute()
    return {"message": "Problems reordered"}

@app.get("/api/v1/problems/{problem_id}", response_model=models.ProblemWithHints)
def get_problem(problem_id: int, current_user: models.User = Depends(get_current_user)):
    response = supabase.table('problems').select("*").eq('problem_id', problem_id).eq('user_id', current_user.user_id).single().execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Problem not found")
    problem = response.data
    
    hints_response = supabase.table('hints').select("*").eq('problem_id', problem_id).order('step_number').execute()
    problem['hints'] = hints_response.data
    
    return problem

@app.post("/api/v1/problems/{problem_id}/solve")
def solve_problem(problem_id: int, log_data: dict, current_user: models.User = Depends(get_current_user)):
    insert_data = {
        "user_id": current_user.user_id,
        "problem_id": problem_id,
        "study_session_id": log_data.get('study_session_id'),
        "solution": log_data.get('solution', ''),
        "is_correct": log_data.get('is_correct', False),
        "time_spent": log_data.get('time_spent'),
    }
    
    response = supabase.table('solve_logs').insert(insert_data).execute()
    return response.data

# --- Study Session Endpoints ---

@app.get("/api/v1/sessions", response_model=List[models.StudySession])
def get_sessions(current_user: models.User = Depends(get_current_user)):
    response = supabase.table('study_sessions').select("*").eq('user_id', current_user.user_id).order('updated_at', desc=True).execute()
    sessions = response.data
    
    for session in sessions:
        curr_response = supabase.table('study_session_curriculums').select('curriculum_id').eq('study_session_id', session['study_session_id']).execute()
        session['curriculum_ids'] = [item['curriculum_id'] for item in curr_response.data]
        
        folder_response = supabase.table('study_session_folders').select('folder_id').eq('study_session_id', session['study_session_id']).execute()
        session['folder_ids'] = [item['folder_id'] for item in folder_response.data]
        
    return sessions

@app.post("/api/v1/sessions", response_model=models.StudySession)
def create_session(session: models.StudySessionCreate, current_user: models.User = Depends(get_current_user)):
    session_data = {
        "user_id": current_user.user_id,
        "name": session.name,
        "mode": session.mode,
        "created_by": current_user.user_id,
        "updated_by": current_user.user_id
    }
    response = supabase.table('study_sessions').insert(session_data).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create session")
    
    new_session = response.data[0]
    session_id = new_session['study_session_id']
    
    if session.curriculum_ids:
        curr_data = [{"study_session_id": session_id, "curriculum_id": cid} for cid in session.curriculum_ids]
        supabase.table('study_session_curriculums').insert(curr_data).execute()
        
    if session.folder_ids:
        folder_data = [{"study_session_id": session_id, "folder_id": fid} for fid in session.folder_ids]
        supabase.table('study_session_folders').insert(folder_data).execute()
        
    new_session['curriculum_ids'] = session.curriculum_ids
    new_session['folder_ids'] = session.folder_ids
    
    return new_session

@app.delete("/api/v1/sessions/{session_id}")
def delete_session(session_id: int, current_user: models.User = Depends(get_current_user)):
    response = supabase.table('study_sessions').delete().eq('study_session_id', session_id).eq('user_id', current_user.user_id).execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"message": "Session deleted"}

@app.get("/api/v1/sessions/{session_id}/problems", response_model=List[models.Problem])
def get_session_problems(session_id: int, current_user: models.User = Depends(get_current_user)):
    session_response = supabase.table('study_sessions').select("*").eq('study_session_id', session_id).eq('user_id', current_user.user_id).single().execute()
    if not session_response.data:
        raise HTTPException(status_code=404, detail="Session not found")
    
    session = session_response.data
    
    curr_response = supabase.table('study_session_curriculums').select('curriculum_id').eq('study_session_id', session_id).execute()
    curriculum_ids = [item['curriculum_id'] for item in curr_response.data]
    
    folder_response = supabase.table('study_session_folders').select('folder_id').eq('study_session_id', session_id).execute()
    folder_ids = [item['folder_id'] for item in folder_response.data]
    
    query = supabase.table('problems').select("*").eq('user_id', current_user.user_id)
    
    or_conditions = []
    if folder_ids:
        or_conditions.append(f"folder_id.in.({','.join(map(str, folder_ids))})")
    if curriculum_ids:
        or_conditions.append(f"curriculum_id.in.({','.join(map(str, curriculum_ids))})")
    
    if or_conditions:
        query = query.or_(",".join(or_conditions))
    
    problems_response = query.execute()
    problems = problems_response.data
    
    if session['mode'] == 'all':
        return problems
    
    problem_ids = [p['problem_id'] for p in problems]
    if not problem_ids:
        return []
        
    logs_response = supabase.table('solve_logs')\
        .select("problem_id, is_correct, created_at")\
        .in_('problem_id', problem_ids)\
        .eq('user_id', current_user.user_id)\
        .order('created_at', desc=True)\
        .execute()
        
    latest_status = {}
    for log in logs_response.data:
        pid = log['problem_id']
        if pid not in latest_status:
            latest_status[pid] = log['is_correct']
            
    final_list = []
    for p in problems:
        pid = p['problem_id']
        if session['mode'] == 'not_attempted':
            if pid not in latest_status:
                final_list.append(p)
        elif session['mode'] == 'wrong':
            if pid in latest_status and not latest_status[pid]:
                final_list.append(p)
                
    return final_list
