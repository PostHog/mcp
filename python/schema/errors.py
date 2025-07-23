from datetime import datetime
from enum import Enum
from uuid import UUID

from pydantic import BaseModel


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
    orderBy: OrderByErrors | None = None
    dateFrom: datetime | None = None
    dateTo: datetime | None = None
    orderDirection: OrderDirectionErrors | None = None
    filterTestAccounts: bool | None = None
    status: StatusErrors | None = None


class ErrorDetails(BaseModel):
    issueId: UUID
    dateFrom: datetime | None = None
    dateTo: datetime | None = None
