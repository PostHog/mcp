from pydantic import BaseModel
from uuid import UUID


class Organization(BaseModel):
    id: UUID
    name: str