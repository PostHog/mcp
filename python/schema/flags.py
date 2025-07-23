from enum import Enum

from pydantic import BaseModel, model_validator


class PostHogFeatureFlag(BaseModel):
    id: int
    key: str
    name: str


class PostHogFlagsResponse(BaseModel):
    results: list[PostHogFeatureFlag] | None = None


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
    value: str | int | bool | list[str] | list[int]
    operator: OperatorType | None = None
    type: str = "person"

    @model_validator(mode="after")
    def validate_operator_value_compatibility(self):
        if not self.operator:
            return self

        value = self.value
        operator = self.operator
        is_array = isinstance(value, list)

        string_ops = {
            OperatorType.EXACT,
            OperatorType.IS_NOT,
            OperatorType.ICONTAINS,
            OperatorType.NOT_ICONTAINS,
            OperatorType.REGEX,
            OperatorType.NOT_REGEX,
            OperatorType.IS_CLEANED_PATH_EXACT,
        }
        number_ops = {
            OperatorType.EXACT,
            OperatorType.IS_NOT,
            OperatorType.GT,
            OperatorType.GTE,
            OperatorType.LT,
            OperatorType.LTE,
            OperatorType.MIN,
            OperatorType.MAX,
        }
        boolean_ops = {OperatorType.EXACT, OperatorType.IS_NOT}
        array_ops = {OperatorType.IN, OperatorType.NOT_IN}

        valid = (
            (isinstance(value, str) and operator in string_ops)
            or (isinstance(value, int | float) and operator in number_ops)
            or (isinstance(value, bool) and operator in boolean_ops)
            or (is_array and operator in array_ops)
        )

        if not valid:
            value_type = "array" if is_array else type(value).__name__
            raise ValueError(f'operator "{operator}" is not valid for value type "{value_type}"')

        if not is_array and operator in array_ops:
            raise ValueError(f'operator "{operator}" requires an array value')

        return self


class Filters(BaseModel):
    properties: list[PersonPropertyFilter]
    rollout_percentage: int


class FilterGroups(BaseModel):
    groups: list[Filters]


class CreateFeatureFlagInput(BaseModel):
    name: str
    key: str
    description: str
    filters: FilterGroups
    active: bool
    tags: list[str] | None = None


class UpdateFeatureFlagInput(BaseModel):
    name: str | None = None
    description: str | None = None
    filters: FilterGroups | None = None
    active: bool | None = None
    tags: list[str] | None = None


class FeatureFlag(BaseModel):
    id: int
    key: str
    name: str
    description: str | None = None
    filters: Filters | None = None
    active: bool
    tags: list[str] | None = None
