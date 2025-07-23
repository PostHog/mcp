from uuid import UUID

from pydantic import BaseModel


class Organization(BaseModel):
    id: UUID
    name: str
