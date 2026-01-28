import httpx
from typing import List
from datetime import datetime
from core.models import Project
from core.base_source import ProjectSource
from core.utils import truncate_description

class GitHubSource(ProjectSource):
    def __init__(self, username: str):
        self.username = username
        self.base_url = f"https://api.github.com/users/{username}/repos"

    async def fetch(self) -> List[Project]:
        projects = []
        page = 1
        async with httpx.AsyncClient() as client:
            while True:
                # GitHub returns 30 by default, we request 100 to minimize calls
                response = await client.get(
                    self.base_url, 
                    params={
                        "sort": "pushed", 
                        "direction": "desc",
                        "per_page": 100,
                        "page": page
                    }
                )
                if response.status_code != 200:
                    break
                
                repos = response.json()
                if not repos:
                    break
                
                for repo in repos:
                    # Skip forks and profile readme repo
                    if repo.get('fork') or repo['name'] == self.username:
                        continue
                        
                    # Handle GitHub's ISO format
                    pushed_at = repo['pushed_at'].replace('Z', '+00:00')
                    dt = datetime.fromisoformat(pushed_at)
                    
                    projects.append(Project(
                        title=repo['name'],
                        date=dt.strftime("%d/%m/%Y"),
                        description=truncate_description(repo['description'] or ""),
                        link=repo['html_url'],
                        stars=repo['stargazers_count'],
                        language=repo['language'],
                        source="GitHub"
                    ))
                
                # If we got fewer than 100 repos, we've reached the end
                if len(repos) < 100:
                    break
                page += 1
                
        return projects
