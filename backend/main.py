from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import RedirectResponse, HTMLResponse
from typing import List
from dotenv import load_dotenv
import os
import httpx
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
GITHUB_CLIENT_ID = os.getenv("GITHUB_CLIENT_ID")
GITHUB_CLIENT_SECRET = os.getenv("GITHUB_CLIENT_SECRET")
SITE_URL = os.getenv("SITE_URL")          # frontend (GitHub Pages)
BACKEND_URL = os.getenv("BACKEND_URL")    # this server (Vercel) — used for OAuth callback

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

# ---------------------------------------------------------------------------
# GitHub OAuth for Decap CMS
# ---------------------------------------------------------------------------

@app.get("/api/auth")
async def github_auth():
    """
    Step 1: Redirect browser to GitHub OAuth consent page.
    Decap CMS opens /api/auth in a popup window.
    """
    # Callback must point to THIS backend, not the frontend site
    callback = f"{BACKEND_URL.rstrip('/')}/api/auth/callback"
    github_oauth_url = (
        f"https://github.com/login/oauth/authorize"
        f"?client_id={GITHUB_CLIENT_ID}"
        f"&scope=repo,user"
        f"&redirect_uri={callback}"
    )
    return RedirectResponse(url=github_oauth_url)


@app.get("/api/auth/callback")
async def github_auth_callback(code: str):
    """
    Step 2: GitHub redirects here with a short-lived code.
    Exchange it for an access token and send it back to the
    Decap CMS opener window via postMessage, then close the popup.
    """
    async with httpx.AsyncClient() as client:
        response = await client.post(
            "https://github.com/login/oauth/access_token",
            data={
                "client_id": GITHUB_CLIENT_ID,
                "client_secret": GITHUB_CLIENT_SECRET,
                "code": code,
            },
            headers={"Accept": "application/json"},
        )
    token_data = response.json()
    access_token = token_data.get("access_token", "")
    token_type = token_data.get("token_type", "bearer")

    # Decap CMS listens for this postMessage in the opener window
    html = f"""
    <!DOCTYPE html>
    <html>
    <head><title>Authorizing...</title></head>
    <body>
      <script>
        (function() {{
          function receiveMessage(e) {{
            console.log("receiveMessage %o", e);
            window.opener.postMessage(
              'authorization:github:success:{{"token":"{access_token}","provider":"github"}}',
              e.origin
            );
          }}
          window.addEventListener("message", receiveMessage, false);
          window.opener.postMessage("authorizing:github", "*");
        }})();
      </script>
    </body>
    </html>
    """
    return HTMLResponse(content=html)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
