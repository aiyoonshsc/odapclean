from pydantic import BaseModel, Field, ConfigDict
from datetime import datetime
from typing import List, Optional

class User(BaseModel):
    user_id: int
    username: str
    email: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(populate_by_name=True)

class UserCreate(BaseModel):
    username: str
    email: Optional[str] = None
    password: str

class UserInDB(User):
    hashed_password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None

class Folder(BaseModel):
    folder_id: int
    user_id: Optional[int] = None
    name: str
    sort_order: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: Optional[int] = None
    updated_by: Optional[int] = None

    model_config = ConfigDict(populate_by_name=True)

class FolderCreate(BaseModel):
    name: str
    user_id: int = 1
    sort_order: int = 0

class Curriculum(BaseModel):
    curriculum_id: int
    name: str
    parent_id: Optional[int] = None
    level: int = 0
    sort_order: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: Optional[int] = None
    updated_by: Optional[int] = None

    model_config = ConfigDict(populate_by_name=True)

class CurriculumCreate(BaseModel):
    name: str
    parent_id: Optional[int] = None
    level: int = 0
    sort_order: int = 0

class Hint(BaseModel):
    hint_id: int
    problem_id: int
    content: str
    step_number: int = 1
    created_at: datetime
    updated_at: Optional[datetime] = None

    model_config = ConfigDict(populate_by_name=True)

class Problem(BaseModel):
    problem_id: int
    user_id: Optional[int] = None
    folder_id: Optional[int] = None
    curriculum_id: Optional[int] = None
    title: str
    problem_image_url: Optional[str] = None
    answer_image_url: Optional[str] = None
    sort_order: int = 0
    created_at: datetime
    updated_at: Optional[datetime] = None
    created_by: Optional[int] = None
    updated_by: Optional[int] = None

    model_config = ConfigDict(populate_by_name=True)

class ProblemWithHints(Problem):
    hints: List[Hint] = []

class ProblemCreate(BaseModel):
    title: str
    folder_id: Optional[int] = None
    curriculum_id: Optional[int] = None
    user_id: int = 1
    hints: List[str] = []
    problem_image_url: Optional[str] = None
    answer_image_url: Optional[str] = None
    sort_order: int = 0

class ProblemUpdate(BaseModel):
    title: Optional[str] = None
    folder_id: Optional[int] = None
    curriculum_id: Optional[int] = None
    hints: Optional[List[str]] = None
    problem_image_url: Optional[str] = None
    answer_image_url: Optional[str] = None
    sort_order: Optional[int] = None

class ProblemListResponse(Problem):
    solve_count: int = 0
    correct_rate: float = 0.0
    latest_status: str = "not_attempted"

class StudySession(BaseModel):
    study_session_id: int
    user_id: int
    name: str
    mode: str
    created_at: datetime
    updated_at: Optional[datetime] = None
    curriculum_ids: List[int] = []
    folder_ids: List[int] = []
    
    model_config = ConfigDict(populate_by_name=True)

class StudySessionCreate(BaseModel):
    name: str
    mode: str = 'all'
    curriculum_ids: List[int] = []
    folder_ids: List[int] = []

class FolderStatItem(BaseModel):
    folder_id: int
    name: str
    total: int
    solved: int
    correct: int
    correct_rate: float

class CurriculumStatItem(BaseModel):
    curriculum_id: int
    name: str
    total: int
    solved: int
    correct: int
    correct_rate: float

class StatisticsResponse(BaseModel):
    total_problems: int
    solved_count: int
    correct_count: int
    correct_rate: float
    by_folder: List[FolderStatItem]
    by_curriculum: List[CurriculumStatItem]

class FolderReorderItem(BaseModel):
    folder_id: int
    sort_order: int

class CurriculumReorderItem(BaseModel):
    curriculum_id: int
    sort_order: int

class ProblemReorderItem(BaseModel):
    problem_id: int
    sort_order: int
