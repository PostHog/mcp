from typing import Optional
from pydantic import BaseModel
from enum import Enum
from datetime import datetime
from uuid import UUID


class OrderByErrors(str, Enum):
    OCCURRENCES = "occurrences"
    FIRST_SEEN = "first_seen"
    LAST_SEEN = "last_seen"
    USERS = "users"
    SESSIONS = "sessions"


class OrderDirectionErrors(str, Enum):
    ASCENDING = "ASC"
    DESCENDING = "DESC"


class StatusErrors(str, Enum):
    ACTIVE = "active"
    RESOLVED = "resolved"
    ALL = "all"
    SUPPRESSED = "suppressed"


class ListErrors(BaseModel):
    orderBy: Optional[OrderByErrors] = None
    dateFrom: Optional[datetime] = None
    dateTo: Optional[datetime] = None
    orderDirection: Optional[OrderDirectionErrors] = None
    filterTestAccounts: Optional[bool] = None
    status: Optional[StatusErrors] = None


class ErrorDetails(BaseModel):
    issueId: UUID
    dateFrom: Optional[datetime] = None
    dateTo: Optional[datetime] = None