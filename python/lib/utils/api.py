from typing import TypeVar

import httpx
from pydantic import BaseModel, ValidationError

from lib.constants import BASE_URL

T = TypeVar("T", bound=BaseModel)


async def with_pagination(url: str, api_token: str, data_class: type[T]) -> list[T]:
    async with httpx.AsyncClient(timeout=30.0) as client:
        response = await client.get(url, headers={"Authorization": f"Bearer {api_token}"})

        if not response.is_success:
            raise Exception(f"Failed to fetch {url}: {response.text}")

        data = response.json()

        try:
            # Parse using a simple dict approach since we have dynamic types
            if not isinstance(data, dict) or "results" not in data:
                raise Exception("Invalid response format")

            results_data = data["results"]
            parsed_results = [data_class.model_validate(item) for item in results_data]

            # Create a simple response object
            class SimpleResponse:
                def __init__(self, data):
                    self.count = data.get("count", 0)
                    self.next = data.get("next")
                    self.previous = data.get("previous")
                    self.results = parsed_results

            parsed_response = SimpleResponse(data)
        except ValidationError as e:
            raise Exception(f"Failed to parse response for {url}") from e

        results = parsed_response.results

        if parsed_response.next:
            next_results = await with_pagination(parsed_response.next, api_token, data_class)
            return results + next_results

        return results


def get_project_base_url(project_id: str) -> str:
    if project_id == "@current":
        return BASE_URL
    return f"{BASE_URL}/project/{project_id}"


