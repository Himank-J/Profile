# Portfolio Backend

A FastAPI backend for a personal portfolio, fetching blog posts from Medium and projects from GitHub.

## Features

- **Medium Integration**: Fetches latest blog posts via RSS feed
- **GitHub Integration**: Fetches all repositories (excluding forks and profile README)
- **Extensible Architecture**: Easy to add new data sources
- **CORS Enabled**: Ready for frontend integration

## Project Structure

```
backend/
├── main.py              # FastAPI application entry point
├── requirements.txt     # Python dependencies
├── .env                 # Environment variables (not in git)
├── core/
│   ├── models.py        # Pydantic data models (Blog, Project)
│   ├── base_source.py   # Abstract base classes for sources
│   └── utils.py         # Utility functions (truncation)
└── sources/
    ├── medium.py        # Medium RSS parser
    └── github.py        # GitHub API integration
```

## Setup

1. **Create virtual environment**
   ```bash
   python -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**
   ```bash
   pip install -r requirements.txt
   ```

3. **Configure environment variables**
   
   Create a `.env` file in the `backend/` directory:
   ```
   MEDIUM_USERNAME=your_medium_username
   GITHUB_USERNAME=your_github_username
   ```

4. **Run the server**
   ```bash
   python main.py
   ```
   
   The API will be available at `http://localhost:8000`

## API Endpoints

### GET /api/blogs

Fetches latest blog posts from Medium.

**Response:**
```json
[
  {
    "title": "Blog Title",
    "date": "28/01/2026",
    "description": "First 200 characters...Show more",
    "link": "https://medium.com/@username/post-slug",
    "image": "https://cdn-images-1.medium.com/...",
    "tags": ["AI", "Machine Learning"],
    "source": "Medium"
  }
]
```

### GET /api/projects

Fetches all GitHub repositories (sorted by last push date).

**Response:**
```json
[
  {
    "title": "repo-name",
    "date": "28/01/2026",
    "description": "Repository description...Show more",
    "link": "https://github.com/username/repo-name",
    "stars": 42,
    "language": "Python",
    "source": "GitHub"
  }
]
```

## API Documentation

FastAPI automatically generates interactive documentation:
- **Swagger UI**: `http://localhost:8000/docs`
- **ReDoc**: `http://localhost:8000/redoc`

## Notes

- Medium RSS feed is limited to 10 most recent posts
- GitHub API has rate limits (60 requests/hour for unauthenticated requests)
- Descriptions are truncated to 200 characters with "...Show more" suffix
