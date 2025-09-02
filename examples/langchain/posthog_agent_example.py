"""
PostHog LangChain Integration Example

This example demonstrates how to use PostHog tools with LangChain using
the local posthog_agent_toolkit package. It shows how to analyze product
usage data similar to the TypeScript example.
"""

import asyncio
import os
import sys
from pathlib import Path

# Add the python package to path for local development
sys.path.insert(0, str(Path(__file__).parent.parent.parent / "python"))

from dotenv import load_dotenv
from langchain_openai import ChatOpenAI
from langchain.agents import AgentExecutor, create_tool_calling_agent
from langchain_core.prompts import ChatPromptTemplate, MessagesPlaceholder
from posthog_agent_toolkit.integrations.langchain.toolkit import PostHogAgentToolkit


async def analyze_product_usage():
    """Analyze product usage using PostHog data."""
    print("🚀 PostHog LangChain Agent - Product Usage Analysis\n")
    
    # Initialize the PostHog toolkit with credentials
    toolkit = PostHogAgentToolkit(
        personal_api_key=os.getenv("POSTHOG_PERSONAL_API_KEY"),
        url=os.getenv("POSTHOG_MCP_URL", "https://mcp.posthog.com/mcp")
    )
    
    # Get the tools (async)
    tools = await toolkit.get_tools()
    
    # Initialize the LLM
    llm = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0,
        api_key=os.getenv("OPENAI_API_KEY")
    )
    
    # Create the prompt template
    prompt = ChatPromptTemplate.from_messages([
        (
            "system",
            "You are a data analyst. Your task is to do a deep dive into what's happening in our product. "
            "Be concise and data-driven in your responses."
        ),
        ("human", "{input}"),
        MessagesPlaceholder("agent_scratchpad"),
    ])
    
    # Create the agent
    agent = create_tool_calling_agent(
        llm=llm,
        tools=tools,
        prompt=prompt,
    )
    
    # Create the agent executor
    agent_executor = AgentExecutor(
        agent=agent,
        tools=tools,
        verbose=False,
        max_iterations=5,
    )
    
    # Run the analysis query
    result = await agent_executor.ainvoke({
        "input": """Please analyze our product usage:
        
        1. Get all available insights (limit 100) and pick the 5 most relevant ones
        2. For each insight, query its data
        3. Summarize the key findings in a brief report
        
        Keep your response focused and data-driven."""
    })
    
    print("\n📊 Analysis Complete!\n")
    print("=" * 50)
    print(result["output"])
    print("=" * 50)


async def main():
    """Main function to run the product usage analysis."""
    try:
        # Load environment variables
        load_dotenv()
        
        # Run the analysis
        await analyze_product_usage()
    except Exception as error:
        print(f"Error: {error}")
        sys.exit(1)


if __name__ == "__main__":
    asyncio.run(main())