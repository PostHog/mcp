from typing import Optional
from pydantic import BaseModel
from src.schema.api import ApiPropertyDefinition, PropertyType


class PropertyDefinition(BaseModel):
    name: str
    property_type: Optional[PropertyType] = None


PropertyDefinitionsResponse = ApiPropertyDefinition