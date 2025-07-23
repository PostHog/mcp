#!/usr/bin/env tsx

// Generates JSON schema from Zod tool-inputs schemas for Python Pydantic schema generation

import * as fs from "node:fs";
import { zodToJsonSchema } from "zod-to-json-schema";
import * as schemas from "../src/schema/tool-inputs";

const output_path = "src/schema/tool-inputs.json";

console.log("Generating JSON schema from Zod tool-inputs schemas...");

try {
	// Convert all Zod schemas to JSON Schema
	const jsonSchemas = {
		$schema: "http://json-schema.org/draft-07/schema#",
		definitions: {} as Record<string, any>,
	};

	// Add each schema to the definitions
	for (const [schemaName, zodSchema] of Object.entries(schemas)) {
		if (schemaName.endsWith("Schema")) {
			console.log(`Converting ${schemaName}...`);
			const jsonSchema = zodToJsonSchema(zodSchema, {
				name: schemaName,
				$refStrategy: "none",
			});

			// Remove the top-level $schema to avoid conflicts
			jsonSchema.$schema = undefined;

			jsonSchemas.definitions[schemaName] = jsonSchema;
		}
	}

	// Write the combined schema
	const schemaString = JSON.stringify(jsonSchemas, null, 2);
	fs.writeFileSync(output_path, schemaString);

	console.log(`✅ JSON schema generated successfully at: ${output_path}`);
	console.log(
		`📋 Generated schemas for ${Object.keys(jsonSchemas.definitions).length} tool input types`,
	);
} catch (err) {
	console.error("❌ Error generating schema:", err);
	process.exit(1);
}
