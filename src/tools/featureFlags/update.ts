import { z } from "zod";
import type { Context, Tool } from "../types";
import { UpdateFeatureFlagInputSchema } from "../../schema/flags";
import { getProjectBaseUrl } from "../../lib/utils/api";

const schema = z.object({
    flagKey: z.string(),
    data: UpdateFeatureFlagInputSchema,
});

type Params = z.infer<typeof schema>;

export const updateHandler = async (
    context: Context,
    params: Params
) => {
    const { flagKey, data } = params;
    const projectId = await context.getProjectId();

    const flagResult = await context.api.featureFlags({ projectId }).update({
        key: flagKey,
        data: data,
    });
    
    if (!flagResult.success) {
        throw new Error(`Failed to update feature flag: ${flagResult.error.message}`);
    }

    const featureFlagWithUrl = {
        ...flagResult.data,
        url: `${getProjectBaseUrl(projectId)}/feature_flags/${flagResult.data.id}`,
    };

    return {
        content: [{ type: "text", text: JSON.stringify(featureFlagWithUrl) }],
    };
};

const tool = (): Tool<typeof schema> => ({
    name: "update-feature-flag",
    description: `Update a new feature flag in the project.
    - To enable a feature flag, you should make sure it is active and the rollout percentage is set to 100 for the group you want to target.
    - To disable a feature flag, you should make sure it is inactive, you can keep the rollout percentage as it is.
    `,
    schema,
    handler: updateHandler,
});

export default tool;