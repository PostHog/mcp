
from pydantic import BaseModel

from schema.api import ApiPropertyDefinition, PropertyType


class PropertyDefinition(BaseModel):
    name: str
    property_type: PropertyType | None = None


PropertyDefinitionsResponse = ApiPropertyDefinition
