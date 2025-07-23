from typing import Any, Dict, List, Optional, Union
from pydantic import BaseModel, field_validator, model_validator
from enum import Enum


class PostHogFeatureFlag(BaseModel):
    id: int
    key: str
    name: str


class PostHogFlagsResponse(BaseModel):
    results: Optional[List[PostHogFeatureFlag]] = None


class OperatorType(str, Enum):
    EXACT = "exact"
    IS_NOT = "is_not"
    ICONTAINS = "icontains"
    NOT_ICONTAINS = "not_icontains"
    REGEX = "regex"
    NOT_REGEX = "not_regex"
    IS_CLEANED_PATH_EXACT = "is_cleaned_path_exact"
    GT = "gt"
    GTE = "gte"
    LT = "lt"
    LTE = "lte"
    MIN = "min"
    MAX = "max"
    IN = "in"
    NOT_IN = "not_in"


class PersonPropertyFilter(BaseModel):
    key: str
    value: Union[str, int, bool, List[str], List[int]]
    operator: Optional[OperatorType] = None
    type: str = "person"

    @model_validator(mode='after')
    def validate_operator_value_compatibility(self):
        if not self.operator:
            return self

        value = self.value
        operator = self.operator
        is_array = isinstance(value, list)

        string_ops = {OperatorType.EXACT, OperatorType.IS_NOT, OperatorType.ICONTAINS, 
                     OperatorType.NOT_ICONTAINS, OperatorType.REGEX, OperatorType.NOT_REGEX, 
                     OperatorType.IS_CLEANED_PATH_EXACT}
        number_ops = {OperatorType.EXACT, OperatorType.IS_NOT, OperatorType.GT, OperatorType.GTE, 
                     OperatorType.LT, OperatorType.LTE, OperatorType.MIN, OperatorType.MAX}
        boolean_ops = {OperatorType.EXACT, OperatorType.IS_NOT}
        array_ops = {OperatorType.IN, OperatorType.NOT_IN}

        valid = (
            (isinstance(value, str) and operator in string_ops) or
            (isinstance(value, (int, float)) and operator in number_ops) or
            (isinstance(value, bool) and operator in boolean_ops) or
            (is_array and operator in array_ops)
        )

        if not valid:
            value_type = "array" if is_array else type(value).__name__
            raise ValueError(f'operator "{operator}" is not valid for value type "{value_type}"')

        if not is_array and operator in array_ops:
            raise ValueError(f'operator "{operator}" requires an array value')

        return self


class Filters(BaseModel):
    properties: List[PersonPropertyFilter]
    rollout_percentage: int


class FilterGroups(BaseModel):
    groups: List[Filters]


class CreateFeatureFlagInput(BaseModel):
    name: str
    key: str
    description: str
    filters: FilterGroups
    active: bool
    tags: Optional[List[str]] = None


class UpdateFeatureFlagInput(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    filters: Optional[FilterGroups] = None
    active: Optional[bool] = None
    tags: Optional[List[str]] = None


class FeatureFlag(BaseModel):
    id: int
    key: str
    name: str
    description: Optional[str] = None
    filters: Optional[Filters] = None
    active: bool
    tags: Optional[List[str]] = None