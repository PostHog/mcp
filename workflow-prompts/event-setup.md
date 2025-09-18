PostHog has been set up in this project.

From the project's file list, select between 10 and 15 files that might have interesting business value for event tracking. Read the files.

We will add events that correspond to meaningful user interactions. Do not add an event that would be a proxy for tracking a pageview, as we can do that automatically.

Tasks: 

- Create a new file with a JSON array at the root of the project: .posthog-events.json. It should include one object for each event we want to add: event name, event description, and the file path we want to place the event in.

- For each of the files and events noted in .posthog-events.json, make edits to capture events with PostHog.

- Add useful properties, and use your access to the source code in node_modules to ensure correctness. You also have access to documentation about creating new events with PostHog. Consider this documentation carefully and follow it closely before adding events. Your integration should be based on documented best practices.

- Do not alter the fundamental architecture of existing files. Make your additions minimal.

- Once edits are complete, check the project for errors. Read the package.json file for any type checking or build scripts that may provide feedback about what to fix.