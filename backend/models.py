from pydantic import BaseModel, Field
from datetime import datetime
from typing import List, Optional

class User(BaseModel):
    id: int
    username: str
    email: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class Folder(BaseModel):
    id: int
    name: str
    user_id: int
    created_at: datetime

class FolderCreate(BaseModel):
    name: str
    user_id: int

class Problem(BaseModel):
    id: int
    title: str
    content: str
    folder_id: Optional[int] = None
    image_url: Optional[str] = None
    created_at: datetime

class ProblemCreate(BaseModel):
    title: str
    content: str
    folder_id: Optional[int] = None
    hints: List[str] = []

class Hint(BaseModel):
    id: int
    problem_id: int
    content: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class HintCreate(BaseModel):
    problem_id: int
    content: str

class SolveLog(BaseModel):
    id: int
    problem_id: int
    user_id: int
    solution: str
    is_correct: bool
    image_url: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ProblemWithHints(Problem):
    hints: List[Hint] = []

class FolderWithProblems(Folder):
    problems: List[Problem] = []