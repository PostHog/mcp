# @posthog/agent-toolkit

A comprehensive toolkit for integrating PostHog with AI agents and LLM applications. This package provides ready-to-use tools for fetching PostHog data, managing feature flags, creating insights, and more.

## Installation

```bash
npm install @posthog/agent-toolkit
```

## Quick Start

The toolkit provides integrations for popular AI frameworks:

### Using with Vercel AI SDK

```typescript
import { openai } from "@ai-sdk/openai";
import { PostHogAgentToolkit } from "@posthog/agent-toolkit/integrations/ai-sdk";
import { generateText } from "ai";

const toolkit = new PostHogAgentToolkit({
    posthogPersonalApiKey: process.env.POSTHOG_PERSONAL_API_KEY!,
    posthogApiBaseUrl: "https://us.posthog.com"
});

const result = await generateText({
    model: openai("gpt-4"),
    tools: toolkit.getTools(),
    prompt: "Analyze our product usage by getting the top 5 insights"
});
```

**[→ See full Vercel AI SDK example](../../examples/ai-sdk/)**

### Using with LangChain.js

```typescript
import { ChatOpenAI } from "@langchain/openai";
import { PostHogAgentToolkit } from "@posthog/agent-toolkit/integrations/langchain";
import { AgentExecutor, createToolCallingAgent } from "langchain/agents";
import { ChatPromptTemplate } from "@langchain/core/prompts";

const toolkit = new PostHogAgentToolkit({
    posthogPersonalApiKey: process.env.POSTHOG_PERSONAL_API_KEY!,
    posthogApiBaseUrl: "https://us.posthog.com"
});

const tools = toolkit.getTools();
const llm = new ChatOpenAI({ model: "gpt-4" });

const prompt = ChatPromptTemplate.fromMessages([
    ["system", "You are a data analyst with access to PostHog analytics"],
    ["human", "{input}"],
    new MessagesPlaceholder("agent_scratchpad"),
]);

const agent = createToolCallingAgent({ llm, tools, prompt });
const executor = new AgentExecutor({ agent, tools });

const result = await executor.invoke({
    input: "Create a dashboard showing user engagement metrics"
});
```

**[→ See full LangChain.js example](../../examples/langchain-js/)**

## Available Tools

The toolkit provides comprehensive access to PostHog's API through these tool categories. For detailed documentation on all tools and their parameters, see the [PostHog MCP Server docs](https://posthog.com/docs/model-context-protocol).

## Examples

### Common Use Cases

#### Analyzing User Behavior

```typescript
// Using AI SDK
const result = await generateText({
    model: openai("gpt-5-mini"),
    tools: toolkit.getTools(),
    prompt: `
        1. Get our top 5 user engagement insights
        2. Query the data for each insight  
        3. Identify trends and provide recommendations
    `
});
```

#### Managing Feature Flags

```typescript  
// Using LangChain
const result = await executor.invoke({
    input: "Create a feature flag called 'new-onboarding' that targets users in the US with 25% rollout"
});
```

#### Building Dashboards

```typescript
const result = await generateText({
    model: openai("gpt-5-mini"), 
    tools: toolkit.getTools(),
    prompt: "Create a dashboard called 'Product Health' with insights about user retention and feature adoption"
});
```