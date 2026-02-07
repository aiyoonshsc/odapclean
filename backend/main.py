from fastapi import FastAPI, HTTPException, File, UploadFile, Form
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel
import shutil
import os
from dotenv import load_dotenv
from supabase import create_client, Client
from supabase.client import ClientOptions

import models

load_dotenv()

# Supabase 클라이언트 초기화
url: str = os.environ.get("SUPABASE_URL")
key: str = os.environ.get("SUPABASE_KEY")
supabase: Client = create_client(url, key, options=ClientOptions(schema="public"))

# 업로드된 이미지를 저장할 디렉토리 (임시)
UPLOAD_DIR = "uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

app = FastAPI()

# CORS 설정
origins = ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/health")
def health_check():
    return {"status": "ok"}

@app.get("/api/v1/folders", response_model=List[models.Folder])
def get_folders():
    response = supabase.table('folders').select("*").execute()
    return response.data

@app.post("/api/v1/folders", response_model=models.Folder)
def create_folder(folder: models.FolderCreate):
    # Pydantic 모델을 딕셔너리로 변환
    folder_dict = folder.dict()
    # Supabase는 기본적으로 UTC로 시간을 저장하므로 timezone 정보 제거
    # folder_dict['created_at'] = datetime.now().isoformat()
    
    response = supabase.table('folders').insert(folder_dict).execute()
    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to create folder")
    return response.data[0]


@app.get("/api/v1/problems", response_model=List[models.ProblemWithHints])
def get_problems(folder_id: Optional[int] = None):
    query = supabase.table('problems').select("*, hints(*)")
    if folder_id:
        query = query.eq('folder_id', folder_id)
    
    response = query.execute()
    return response.data

@app.post("/api/v1/problems", response_model=models.ProblemWithHints)
async def create_problem(
    title: str = Form(...),
    content: str = Form(...),
    hints: List[str] = Form([]),
    image: Optional[UploadFile] = File(None),
    folder_id: Optional[int] = Form(None),
):
    image_url = None
    if image:
        # 이미지 파일명을 고유하게 만듭니다.
        file_ext = os.path.splitext(image.filename)[1]
        file_name = f"problem_{datetime.now().timestamp()}{file_ext}"
        
        # Supabase Storage에 업로드
        try:
            supabase.storage.from_('images').upload(file=image.file, path=file_name, file_options={"content-type": image.content_type})
            # 공개 URL 가져오기
            image_url = supabase.storage.from_('images').get_public_url(file_name)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Image upload failed: {e}")


    problem_data = {
        "title": title,
        "content": content,
        "folder_id": folder_id,
        "image_url": image_url,
    }
    
    problem_response = supabase.table('problems').insert(problem_data).execute()
    if not problem_response.data:
        raise HTTPException(status_code=400, detail="Failed to create problem")
    
    new_problem = problem_response.data[0]
    
    created_hints = []
    if hints:
        hint_data = [{"problem_id": new_problem['id'], "content": h} for h in hints if h]
        if hint_data:
            hint_response = supabase.table('hints').insert(hint_data).execute()
            if hint_response.data:
                created_hints = hint_response.data

    new_problem['hints'] = created_hints
    return new_problem


@app.get("/api/v1/problems/{problem_id}", response_model=models.ProblemWithHints)
def get_problem(problem_id: int):
    response = supabase.table('problems').select("*, hints(*)").eq('id', problem_id).single().execute()
    if not response.data:
        raise HTTPException(status_code=404, detail="Problem not found")
    return response.data

@app.post("/api/v1/problems/{problem_id}/solve")
async def solve_problem(
    problem_id: int,
    solution: str = Form(...),
    file: Optional[UploadFile] = File(None)
):
    image_url = None
    if file:
        file_ext = os.path.splitext(file.filename)[1]
        file_name = f"solution_{problem_id}_{datetime.now().timestamp()}{file_ext}"
        try:
            supabase.storage.from_('images').upload(file=file.file, path=file_name, file_options={"content-type": file.content_type})
            image_url = supabase.storage.from_('images').get_public_url(file_name)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Image upload failed: {e}")

    # 정답 확인 로직 (임시)
    is_correct = True

    solve_log_data = {
        "problem_id": problem_id,
        "user_id": 1,  # 임시 사용자 ID
        "solution": solution,
        "is_correct": is_correct,
        "image_url": image_url,
    }
    
    response = supabase.table('solve_logs').insert(solve_log_data).execute()

    if not response.data:
        raise HTTPException(status_code=400, detail="Failed to submit solution")

    return {"message": "Solution submitted successfully", "is_correct": is_correct}


@app.get("/")
async def root():
    return {"message": "Welcome to OdapClean API"}
