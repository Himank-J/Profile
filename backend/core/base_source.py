from abc import ABC, abstractmethod
from typing import List, Any
from core.models import Blog, Project

class BaseSource(ABC):
    @abstractmethod
    async def fetch(self) -> List[Any]:
        pass

class BlogSource(BaseSource):
    @abstractmethod
    async def fetch(self) -> List[Blog]:
        pass

class ProjectSource(BaseSource):
    @abstractmethod
    async def fetch(self) -> List[Project]:
        pass
