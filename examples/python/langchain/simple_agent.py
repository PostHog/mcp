"""Simple PostHog Agent Example using Langchain.

This example demonstrates how to use the PostHogAgentToolkit to create
an agent that can interact with PostHog's analytics platform.
"""

import os

from langchain.agents import AgentExecutor, create_react_agent
from langchain.prompts import PromptTemplate
from langchain_openai import ChatOpenAI

# Import from the posthog-agents package
from integrations.langchain.toolkit import PostHogAgentToolkit
from dotenv import load_dotenv

load_dotenv()

def main():
    posthog_api_key = os.getenv("POSTHOG_PERSONAL_API_KEY")
    if not posthog_api_key:
        raise ValueError("Please set POSTHOG_PERSONAL_API_KEY environment variable")

    api_base_url = os.getenv("POSTHOG_API_BASE_URL", "https://us.posthog.com")

    openai_api_key = os.getenv("OPENAI_API_KEY")
    if not openai_api_key:
        raise ValueError("Please set OPENAI_API_KEY environment variable")

    llm = ChatOpenAI(
        model="gpt-4o-mini",
        temperature=0,
        api_key=openai_api_key
    )

    # Initialize toolkit with direct parameters (simple and clean!)
    toolkit = PostHogAgentToolkit(
        personal_api_key=posthog_api_key,
        api_base_url=api_base_url,
        inkeep_api_key=os.getenv("INKEEP_API_KEY")
    )

    # Get tools from the toolkit
    tools = toolkit.get_tools()

    prompt = PromptTemplate.from_template("""You are a helpful assistant that can interact with PostHog analytics.
You have access to various PostHog tools to help users analyze their data, manage feature flags, 
create insights, and more.

Answer the following questions as best you can. You have access to the following tools:

{tools}

Use the following format:

Question: the input question you must answer
Thought: you should always think about what to do
Action: the action to take, should be one of [{tool_names}]
Action Input: the input to the action
Observation: the result of the action
... (this Thought/Action/Action Input/Observation can repeat N times)
Thought: I now know the final answer
Final Answer: the final answer to the original input question

Begin!

Question: {input}
Thought: {agent_scratchpad}""")

    agent = create_react_agent(
        llm=llm,
        tools=tools,
        prompt=prompt
    )

    agent_executor = AgentExecutor(
        agent=agent,
        tools=tools,
        verbose=True,
        handle_parsing_errors=True
    )

    print("PostHog Agent initialized successfully!")
    print("\nAvailable tools:")
    for tool in tools:
        print(f"  - {tool.name}: {tool.description[:100]}...")

    print("\n" + "="*60)
    print("Interactive PostHog Agent")
    print("="*60)
    print("Type 'exit' or 'quit' to end the session")
    print("="*60 + "\n")

    while True:
        try:
            user_input = input("\nWhat would you like to know about your PostHog data? > ")

            if user_input.lower() in ['exit', 'quit']:
                print("Goodbye!")
                break

            if not user_input.strip():
                continue

            result = agent_executor.invoke({"input": user_input})
            print(f"\nAnswer: {result['output']}")

        except KeyboardInterrupt:
            print("\nGoodbye!")
            break
        except Exception as e:
            print(f"\nError: {e}")
            print("Please try again with a different question.")


if __name__ == "__main__":
    main()
