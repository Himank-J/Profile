from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from typing import List
from dotenv import load_dotenv
import os
from core.models import Blog, Project
from sources.medium import MediumSource
from sources.github import GitHubSource

# Load environment variables from .env file
load_dotenv()

app = FastAPI(title="Portfolio Backend")

# Enable CORS for frontend integration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration from environment variables
MEDIUM_USERNAME = os.getenv("MEDIUM_USERNAME")
GITHUB_USERNAME = os.getenv("GITHUB_USERNAME")

blog_source = MediumSource(MEDIUM_USERNAME)
project_source = GitHubSource(GITHUB_USERNAME)

@app.get("/api/blogs", response_model=List[Blog])
async def get_blogs():
    """
    Fetch latest blog posts from Medium.
    """
    return await blog_source.fetch()

@app.get("/api/projects", response_model=List[Project])
async def get_projects():
    """
    Fetch latest projects from GitHub.
    """
    return await project_source.fetch()

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
