import { z } from "zod";

// Survey question types
const BaseSurveyQuestionSchema = z.object({
	question: z.string(),
	description: z.string().optional(),
	descriptionContentType: z.enum(["html", "text"]).optional(),
	optional: z.boolean().optional(),
	buttonText: z.string().optional(),
});

// Branching logic schemas
const NextQuestionBranchingSchema = z.object({
	type: z.literal("next_question"),
});

const EndBranchingSchema = z.object({
	type: z.literal("end"),
});

const ResponseBasedBranchingSchema = z.object({
	type: z.literal("response_based"),
	responseValues: z.record(z.string()),
});

const SpecificQuestionBranchingSchema = z.object({
	type: z.literal("specific_question"),
	index: z.number(),
});

const BranchingSchema = z.union([
	NextQuestionBranchingSchema,
	EndBranchingSchema,
	ResponseBasedBranchingSchema,
	SpecificQuestionBranchingSchema,
]);

// Question type schemas
const OpenQuestionSchema = BaseSurveyQuestionSchema.extend({
	type: z.literal("open"),
	branching: BranchingSchema.optional(),
});

const LinkQuestionSchema = BaseSurveyQuestionSchema.extend({
	type: z.literal("link"),
	link: z.string().url(),
	branching: BranchingSchema.optional(),
});

const RatingQuestionSchema = BaseSurveyQuestionSchema.extend({
	type: z.literal("rating"),
	display: z.enum(["number", "emoji"]).optional(),
	scale: z.number().optional(),
	lowerBoundLabel: z.string().optional(),
	upperBoundLabel: z.string().optional(),
	branching: BranchingSchema.optional(),
});

const SingleChoiceQuestionSchema = BaseSurveyQuestionSchema.extend({
	type: z.literal("single_choice"),
	choices: z.array(z.string()),
	shuffleOptions: z.boolean().optional(),
	hasOpenChoice: z.boolean().optional(),
	branching: BranchingSchema.optional(),
});

const MultipleChoiceQuestionSchema = BaseSurveyQuestionSchema.extend({
	type: z.literal("multiple_choice"),
	choices: z.array(z.string()),
	shuffleOptions: z.boolean().optional(),
	hasOpenChoice: z.boolean().optional(),
	branching: BranchingSchema.optional(),
});

export const SurveyQuestionSchema = z.union([
	OpenQuestionSchema,
	LinkQuestionSchema,
	RatingQuestionSchema,
	SingleChoiceQuestionSchema,
	MultipleChoiceQuestionSchema,
]);

// Survey input schemas
export const CreateSurveyInputSchema = z.object({
	name: z.string(),
	description: z.string().optional(),
	type: z.enum(["popover", "api", "widget", "external_survey"]).optional(),
	questions: z.array(SurveyQuestionSchema),
	start_date: z.string().datetime().optional(),
	end_date: z.string().datetime().optional(),
	archived: z.boolean().optional(),
	responses_limit: z.number().optional(),
	iteration_count: z.number().optional(),
	iteration_frequency_days: z.number().optional(),
	enable_partial_responses: z.boolean().optional(),
});

export const UpdateSurveyInputSchema = z.object({
	name: z.string().optional(),
	description: z.string().optional(),
	type: z.enum(["popover", "api", "widget", "external_survey"]).optional(),
	questions: z.array(SurveyQuestionSchema).optional(),
	start_date: z.string().datetime().optional(),
	end_date: z.string().datetime().optional(),
	archived: z.boolean().optional(),
	responses_limit: z.number().optional(),
	iteration_count: z.number().optional(),
	iteration_frequency_days: z.number().optional(),
	enable_partial_responses: z.boolean().optional(),
});

export const ListSurveysSchema = z.object({
	limit: z.number().optional(),
	offset: z.number().optional(),
	search: z.string().optional(),
});

// Survey response schemas
export const SurveySchema = z.object({
	id: z.string().uuid(),
	name: z.string(),
	description: z.string().optional(),
	type: z.enum(["popover", "api", "widget", "external_survey"]),
	questions: z.array(z.any()), // Keep flexible for API responses
	created_at: z.string().datetime(),
	start_date: z.string().datetime().optional(),
	end_date: z.string().datetime().optional(),
	archived: z.boolean(),
	responses_limit: z.number().optional(),
	iteration_count: z.number().optional(),
	iteration_frequency_days: z.number().optional(),
	enable_partial_responses: z.boolean().optional(),
});

export type CreateSurveyInput = z.infer<typeof CreateSurveyInputSchema>;
export type UpdateSurveyInput = z.infer<typeof UpdateSurveyInputSchema>;
export type ListSurveysData = z.infer<typeof ListSurveysSchema>;
export type Survey = z.infer<typeof SurveySchema>;
export type SurveyQuestion = z.infer<typeof SurveyQuestionSchema>;
