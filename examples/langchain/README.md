# PostHog LangChain Python Integration Example

This example demonstrates how to use PostHog tools with LangChain using the local `posthog_agent_toolkit` package.

## Setup

1. Install dependencies:
```bash
# Create and activate virtual environment
python -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install the local PostHog Agent Toolkit
pip install -e ../../python

# Install example dependencies
pip install langchain langchain-openai python-dotenv
```

2. Copy the environment file and fill in your credentials:
```bash
cp .env.example .env
```

3. Update your `.env` file with:
   - `POSTHOG_PERSONAL_API_KEY`: Your PostHog personal API key
   - `OPENAI_API_KEY`: Your OpenAI API key

## Usage

Run the example:
```bash
python posthog_agent_example.py
```

The example will:
1. Connect to PostHog using your API key
2. Load all available PostHog tools
3. Create a LangChain agent with GPT-4o-mini
4. Analyze product usage by:
   - Getting available insights
   - Querying data for the most relevant ones
   - Summarizing key findings

## What It Does

The example demonstrates a product usage analysis workflow:
- Fetches up to 100 insights from your PostHog instance
- Identifies the 5 most relevant insights
- Queries the data for each insight
- Provides a data-driven summary of findings

## Customization

You can modify the analysis query in `posthog_agent_example.py` to:
- Focus on specific metrics
- Analyze feature flags
- Review dashboards
- Query error tracking data
- Search PostHog documentation

## Requirements

- Python 3.8+
- PostHog personal API key with appropriate permissions
- OpenAI API key (or another LLM provider)