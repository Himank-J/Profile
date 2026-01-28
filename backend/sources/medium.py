import feedparser
import httpx
import re
from typing import List, Optional, Tuple
from datetime import datetime
from time import mktime
from html import unescape
from core.models import Blog
from core.base_source import BlogSource
from core.utils import truncate_description

class MediumSource(BlogSource):
    def __init__(self, username: str):
        self.username = username
        self.rss_url = f"https://medium.com/feed/@{username}"

    def _parse_html_content(self, html: str) -> Tuple[Optional[str], str]:
        """
        Extract the first image URL and clean text from HTML content.
        Returns: (image_url, clean_text)
        """
        # Extract first image URL
        image_match = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', html)
        image_url = image_match.group(1) if image_match else None
        
        # Remove HTML tags to get clean text
        # First remove figure/img tags entirely
        clean = re.sub(r'<figure[^>]*>.*?</figure>', '', html, flags=re.DOTALL)
        clean = re.sub(r'<img[^>]*/?>', '', clean)
        # Remove all remaining HTML tags
        clean = re.sub(r'<[^>]+>', '', clean)
        # Unescape HTML entities
        clean = unescape(clean)
        # Normalize whitespace
        clean = re.sub(r'\s+', ' ', clean).strip()
        
        return image_url, clean

    async def fetch(self) -> List[Blog]:
        blogs = []
        
        async with httpx.AsyncClient(follow_redirects=True, timeout=30.0) as client:
            try:
                response = await client.get(self.rss_url)
                if response.status_code == 200:
                    feed = feedparser.parse(response.text)
                    for entry in feed.entries:
                        if hasattr(entry, 'published_parsed') and entry.published_parsed:
                            dt = datetime.fromtimestamp(mktime(entry.published_parsed))
                        else:
                            dt = datetime.now()
                        
                        # Parse HTML content
                        raw_content = entry.summary if 'summary' in entry else ""
                        image_url, clean_description = self._parse_html_content(raw_content)
                        
                        # Extract tags (up to 5)
                        tags = None
                        if hasattr(entry, 'tags') and entry.tags:
                            tags = [tag.term for tag in entry.tags[:5]]
                            
                        blogs.append(Blog(
                            title=entry.title,
                            date=dt.strftime("%d/%m/%Y"),
                            description=truncate_description(clean_description),
                            link=entry.link,
                            image=image_url,
                            tags=tags,
                            source="Medium"
                        ))
            except Exception:
                pass

        return blogs
