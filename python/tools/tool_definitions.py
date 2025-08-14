import json
from pathlib import Path
from typing import TypedDict


class ToolDefinition(TypedDict):
    description: str


ToolDefinitions = dict[str, ToolDefinition]


root_dir = Path(__file__).parent.parent.parent
definitions_path = root_dir / "schema" / "tool-definitions.json"

with open(definitions_path) as f:
    tool_definitions: ToolDefinitions = json.load(f)


def get_tool_definition(tool_name: str) -> ToolDefinition:
    """Get a tool definition by name."""
    definition = tool_definitions.get(tool_name)
    if not definition:
        raise ValueError(f"Tool definition not found for: {tool_name}")
    return definition
