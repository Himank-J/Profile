from pydantic import BaseModel
from datetime import datetime
from typing import Optional, List

class Blog(BaseModel):
    title: str
    date: str
    description: str
    link: str
    image: Optional[str] = None
    tags: Optional[List[str]] = None
    source: str = "Medium"

class Project(BaseModel):
    title: str
    date: str 
    description: str
    link: str
    stars: Optional[int] = 0
    language: Optional[str] = None
    source: str = "GitHub"
    created_at: Optional[str] = None   
    updated_at: Optional[str] = None
