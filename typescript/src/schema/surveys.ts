import { z } from "zod";
import { FilterGroupsSchema } from "./flags.js";

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

// Single choice response branching - uses numeric choice indices (0, 1, 2, etc.)
const SingleChoiceResponseBranchingSchema = z
	.object({
		type: z.literal("response_based"),
		responseValues: z
			.record(z.string(), z.union([z.number(), z.literal("end")]))
			.describe(
				"Only include keys for responses that should branch to a specific question or 'end'. Omit keys for responses that should proceed to the next question (default behavior).",
			),
	})
	.describe(
		'For single choice questions: use choice indices as string keys ("0", "1", "2", etc.)',
	);

// NPS rating response branching - uses sentiment categories
const NPSResponseBranchingSchema = z
	.object({
		type: z.literal("response_based"),
		responseValues: z
			.record(
				z
					.enum(["detractors", "passives", "promoters"])
					.describe(
						"NPS sentiment categories: detractors (0-6), passives (7-8), promoters (9-10)",
					),
				z.union([z.number(), z.literal("end")]),
			)
			.describe(
				"Only include keys for responses that should branch to a specific question or 'end'. Omit keys for responses that should proceed to the next question (default behavior).",
			),
	})
	.describe(
		"For NPS rating questions: use sentiment keys based on score ranges - detractors (0-6), passives (7-8), promoters (9-10)",
	);

// Match type enum for URL and device type targeting
const MatchTypeEnum = z
	.enum(["regex", "not_regex", "exact", "is_not", "icontains", "not_icontains"])
	.describe(
		"URL/device matching types: 'regex' (matches regex pattern), 'not_regex' (does not match regex pattern), 'exact' (exact string match), 'is_not' (not exact match), 'icontains' (case-insensitive contains), 'not_icontains' (case-insensitive does not contain)",
	);

// General rating response branching - uses sentiment categories
const GeneralSentimentResponseBranchingSchema = z
	.object({
		type: z.literal("response_based"),
		responseValues: z
			.record(
				z
					.enum(["negative", "neutral", "positive"])
					.describe(
						"General rating sentiment categories: negative (lower third of scale), neutral (middle third), positive (upper third)",
					),
				z.union([z.number(), z.literal("end")]),
			)
			.describe(
				"Only include keys for responses that should branch to a specific question or 'end'. Omit keys for responses that should proceed to the next question (default behavior).",
			),
	})
	.describe(
		"For general rating questions: use sentiment keys based on scale thirds - negative (lower third), neutral (middle third), positive (upper third)",
	);

const SpecificQuestionBranchingSchema = z.object({
	type: z.literal("specific_question"),
	index: z.number(),
});

// Base branching schema for questions that use index-based branching
const BaseBranchingSchema = z.union([
	NextQuestionBranchingSchema,
	EndBranchingSchema,
	SingleChoiceResponseBranchingSchema,
	SpecificQuestionBranchingSchema,
]);

// NPS branching schema for NPS rating questions
const NPSBranchingSchema = z.union([
	NextQuestionBranchingSchema,
	EndBranchingSchema,
	NPSResponseBranchingSchema,
	SpecificQuestionBranchingSchema,
]);

// General sentiment branching schema for other rating questions
const GeneralSentimentBranchingSchema = z.union([
	NextQuestionBranchingSchema,
	EndBranchingSchema,
	GeneralSentimentResponseBranchingSchema,
	SpecificQuestionBranchingSchema,
]);

// Question type schemas
const OpenQuestionSchema = BaseSurveyQuestionSchema.extend({
	type: z.literal("open"),
});

const LinkQuestionSchema = BaseSurveyQuestionSchema.extend({
	type: z.literal("link"),
	link: z.string().url(),
});

const RatingQuestionSchema = BaseSurveyQuestionSchema.extend({
	type: z.literal("rating"),
	display: z
		.enum(["number", "emoji"])
		.optional()
		.describe("Display format: 'number' shows numeric scale, 'emoji' shows emoji scale"),
	scale: z
		.number()
		.optional()
		.describe("Rating scale maximum (e.g., 5 for 1-5 scale, 10 for 0-10 scale)"),
	lowerBoundLabel: z
		.string()
		.optional()
		.describe("Label for the lowest rating (e.g., 'Very Poor')"),
	upperBoundLabel: z
		.string()
		.optional()
		.describe("Label for the highest rating (e.g., 'Excellent')"),
	branching: GeneralSentimentBranchingSchema.optional(),
});

const NPSRatingQuestionSchema = BaseSurveyQuestionSchema.extend({
	type: z.literal("rating"),
	display: z.literal("number").describe("NPS questions always use numeric scale"),
	scale: z.literal(10).describe("NPS questions always use 0-10 scale"),
	lowerBoundLabel: z
		.string()
		.optional()
		.describe("Label for 0 rating (typically 'Not at all likely')"),
	upperBoundLabel: z
		.string()
		.optional()
		.describe("Label for 10 rating (typically 'Extremely likely')"),
	branching: NPSBranchingSchema.optional(),
});

const SingleChoiceQuestionSchema = BaseSurveyQuestionSchema.extend({
	type: z.literal("single_choice"),
	choices: z
		.array(z.string())
		.describe(
			"Array of choice options. Choice indices (0, 1, 2, etc.) are used for branching logic",
		),
	shuffleOptions: z
		.boolean()
		.optional()
		.describe("Whether to randomize the order of choices for each respondent"),
	hasOpenChoice: z
		.boolean()
		.optional()
		.describe("Whether the last choice (typically 'Other', is an open text input question"),
	branching: BaseBranchingSchema.optional(),
});

const MultipleChoiceQuestionSchema = BaseSurveyQuestionSchema.extend({
	type: z.literal("multiple_choice"),
	choices: z
		.array(z.string())
		.describe(
			"Array of choice options. Multiple selections allowed. No branching logic supported.",
		),
	shuffleOptions: z
		.boolean()
		.optional()
		.describe("Whether to randomize the order of choices for each respondent"),
	hasOpenChoice: z
		.boolean()
		.optional()
		.describe("Whether the last choice (typically 'Other', is an open text input question"),
});

export const SurveyQuestionSchema = z.union([
	OpenQuestionSchema,
	LinkQuestionSchema,
	RatingQuestionSchema,
	NPSRatingQuestionSchema,
	SingleChoiceQuestionSchema,
	MultipleChoiceQuestionSchema,
]);

// Survey condition schema
const SurveyConditionsSchema = z.object({
	url: z.string().optional(),
	selector: z.string().optional(),
	seenSurveyWaitPeriodInDays: z
		.number()
		.optional()
		.describe("Don't show this survey to users who saw any survey in the last x days."),
	urlMatchType: MatchTypeEnum.optional(),
	events: z
		.object({
			repeatedActivation: z
				.boolean()
				.optional()
				.describe(
					"Whether to show the survey every time one of the events is triggered (true), or just once (false)",
				),
			values: z
				.array(
					z.object({
						name: z.string(),
					}),
				)
				.optional()
				.describe("Array of event names that trigger the survey"),
		})
		.optional(),
	deviceTypes: z.array(z.enum(["Desktop", "Mobile", "Tablet"])).optional(),
	deviceTypesMatchType: MatchTypeEnum.optional(),
	linkedFlagVariant: z
		.string()
		.optional()
		.describe("The variant of the feature flag linked to this survey"),
});

// Survey appearance schema
const SurveyAppearanceSchema = z.object({
	backgroundColor: z.string().optional(),
	submitButtonColor: z.string().optional(),
	textColor: z.string().optional(), // deprecated, use auto contrast text color instead
	submitButtonText: z.string().optional(),
	submitButtonTextColor: z.string().optional(),
	descriptionTextColor: z.string().optional(),
	ratingButtonColor: z.string().optional(),
	ratingButtonActiveColor: z.string().optional(),
	ratingButtonHoverColor: z.string().optional(),
	whiteLabel: z.boolean().optional(),
	autoDisappear: z.boolean().optional(),
	displayThankYouMessage: z.boolean().optional(),
	thankYouMessageHeader: z.string().optional(),
	thankYouMessageDescription: z.string().optional(),
	thankYouMessageDescriptionContentType: z.enum(["html", "text"]).optional(),
	thankYouMessageCloseButtonText: z.string().optional(),
	borderColor: z.string().optional(),
	position: z
		.enum([
			"top_left",
			"top_center",
			"top_right",
			"middle_left",
			"middle_center",
			"middle_right",
			"left",
			"right",
			"center",
			"next_to_trigger",
		])
		.optional(),
	placeholder: z.string().optional(),
	shuffleQuestions: z.boolean().optional(),
	surveyPopupDelaySeconds: z.number().optional(),
	widgetType: z.enum(["button", "tab", "selector"]).optional(),
	widgetSelector: z.string().optional(),
	widgetLabel: z.string().optional(),
	widgetColor: z.string().optional(),
	fontFamily: z.string().optional(),
	maxWidth: z.string().optional(),
	zIndex: z.string().optional(),
	disabledButtonOpacity: z.string().optional(),
	boxPadding: z.string().optional(),
});

// User schema for created_by fields
const UserSchema = z.object({
	id: z.number(),
	uuid: z.string(),
	distinct_id: z.string(),
	first_name: z.string(),
	email: z.string(),
});

// Survey input schemas
export const CreateSurveyInputSchema = z.object({
	name: z.string(),
	description: z.string().optional(),
	type: z.enum(["popover", "api", "widget", "external_survey"]).optional(),
	questions: z.array(SurveyQuestionSchema),
	appearance: SurveyAppearanceSchema.optional(),
	start_date: z
		.string()
		.datetime()
		.nullable()
		.optional()
		.default(null)
		.describe(
			"Setting this will launch the survey immediately. Don't add a start_date unless explicitly requested to do so.",
		),
	responses_limit: z.number().nullable().optional(),
	iteration_count: z.number().nullable().optional(),
	iteration_frequency_days: z.number().nullable().optional(),
	enable_partial_responses: z.boolean().optional(),
	linked_flag_id: z
		.number()
		.nullable()
		.optional()
		.describe("The feature flag linked to this survey"),
	targeting_flag_filters: FilterGroupsSchema.optional().describe(
		"Target specific users based on their properties. Example: {groups: [{properties: [{key: 'email', value: ['@company.com'], operator: 'icontains'}], rollout_percentage: 100}]}",
	),
});

export const UpdateSurveyInputSchema = z.object({
	name: z.string().optional(),
	description: z.string().optional(),
	type: z.enum(["popover", "api", "widget", "external_survey"]).optional(),
	questions: z.array(SurveyQuestionSchema).optional(),
	conditions: SurveyConditionsSchema.optional(),
	appearance: SurveyAppearanceSchema.optional(),
	schedule: z
		.enum(["once", "recurring", "always"])
		.optional()
		.describe(
			"Survey scheduling behavior: 'once' = show once per user (default), 'recurring' = repeat based on iteration_count and iteration_frequency_days settings, 'always' = show every time conditions are met (mainly for widget surveys)",
		),
	start_date: z
		.string()
		.datetime()
		.optional()
		.describe(
			"When the survey should start being shown to users. Setting this will launch the survey",
		),
	end_date: z
		.string()
		.datetime()
		.optional()
		.describe(
			"When the survey stopped being shown to users. Setting this will complete the survey.",
		),
	archived: z.boolean().optional(),
	responses_limit: z
		.number()
		.nullable()
		.optional()
		.describe("The maximum number of responses before automatically stopping the survey."),
	iteration_count: z
		.number()
		.nullable()
		.optional()
		.describe("For recurring schedule. Controls how many times the survey should repeat"),
	iteration_frequency_days: z
		.number()
		.nullable()
		.optional()
		.describe("For recurring schedule. The days between each iteration (in iteration_count)"),
	enable_partial_responses: z
		.boolean()
		.optional()
		.describe(
			"When at least one question is answered, the response is stored (true). The response is stored when all questions are answered (false).",
		),
	linked_flag_id: z
		.number()
		.nullable()
		.optional()
		.describe("The feature flag to link to this survey"),
	targeting_flag_id: z
		.number()
		.optional()
		.describe("An existing targeting flag to use for this survey"),
	targeting_flag_filters: FilterGroupsSchema.optional().describe(
		"Target specific users based on their properties. Example: {groups: [{properties: [{key: 'email', value: ['@company.com'], operator: 'icontains'}], rollout_percentage: 50}]}",
	),
	remove_targeting_flag: z
		.boolean()
		.optional()
		.describe(
			"Set to true to completely remove all targeting filters from the survey, making it visible to all users (subject to other display conditions like URL matching).",
		),
});

export const ListSurveysSchema = z.object({
	limit: z.number().optional(),
	offset: z.number().optional(),
	search: z.string().optional(),
});

// Survey response schemas
export const SurveyResponseSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().optional(),
	type: z.enum(["popover", "api", "widget", "external_survey"]),
	questions: z.array(SurveyQuestionSchema),
	conditions: SurveyConditionsSchema.nullable().optional(),
	appearance: SurveyAppearanceSchema.nullable().optional(),
	created_at: z.string(),
	created_by: UserSchema.optional(),
	start_date: z.string().nullable().optional(),
	end_date: z.string().nullable().optional(),
	archived: z.boolean().optional(),
	responses_limit: z.number().nullable().optional(),
	iteration_count: z.number().nullable().optional(),
	iteration_frequency_days: z.number().nullable().optional(),
	enable_partial_responses: z.boolean().optional(),
	targeting_flag: z
		.any()
		.optional()
		.describe(
			"Target specific users based on their properties. Example: {groups: [{properties: [{key: 'email', value: ['@company.com'], operator: 'icontains'}], rollout_percentage: 50}]}",
		),
});

// Survey list item schema (used by list endpoint - doesn't include questions)
export const SurveyListItemSchema = z.object({
	id: z.string(),
	name: z.string(),
	description: z.string().nullable().optional(),
	type: z.enum(["popover", "api", "widget", "external_survey"]),
	archived: z.boolean().optional(),
	created_at: z.string(),
	created_by: UserSchema.nullable().optional(),
	start_date: z.string().nullable().optional(),
	end_date: z.string().nullable().optional(),
	conditions: z.any().optional(),
	responses_limit: z.number().nullable().optional(),
	targeting_flag: z.any().optional(),
	iteration_count: z.number().nullable().optional(),
	iteration_frequency_days: z.number().nullable().optional(),
});

// Survey response statistics schemas
export const SurveyEventStatsSchema = z.object({
	total_count: z.number(),
	total_count_only_seen: z.number(),
	unique_persons: z.number(),
	unique_persons_only_seen: z.number(),
	first_seen: z.string().nullable(),
	last_seen: z.string().nullable(),
});

export const SurveyRatesSchema = z.object({
	response_rate: z.number(),
	dismissal_rate: z.number(),
	unique_users_response_rate: z.number(),
	unique_users_dismissal_rate: z.number(),
});

export const SurveyStatsSchema = z.object({
	"survey shown": SurveyEventStatsSchema,
	"survey dismissed": SurveyEventStatsSchema,
	"survey sent": SurveyEventStatsSchema,
});

export const SurveyResponseStatsSchema = z.object({
	stats: SurveyStatsSchema,
	rates: SurveyRatesSchema,
	survey_id: z.string().optional(),
	start_date: z.string().nullable().optional(),
	end_date: z.string().nullable().optional(),
});

export const GetSurveyStatsInputSchema = z.object({
	date_from: z
		.string()
		.optional()
		.describe("Optional ISO timestamp for start date (e.g. 2024-01-01T00:00:00Z)"),
	date_to: z
		.string()
		.optional()
		.describe("Optional ISO timestamp for end date (e.g. 2024-01-31T23:59:59Z)"),
});

export const GetSurveySpecificStatsInputSchema = z.object({
	survey_id: z.string().describe("Survey ID to get statistics for"),
	date_from: z
		.string()
		.optional()
		.describe("Optional ISO timestamp for start date (e.g. 2024-01-01T00:00:00Z)"),
	date_to: z
		.string()
		.optional()
		.describe("Optional ISO timestamp for end date (e.g. 2024-01-31T23:59:59Z)"),
});

export type CreateSurveyInput = z.infer<typeof CreateSurveyInputSchema>;
export type UpdateSurveyInput = z.infer<typeof UpdateSurveyInputSchema>;
export type ListSurveysData = z.infer<typeof ListSurveysSchema>;
export type Survey = z.infer<typeof SurveyResponseSchema>;
export type SurveyListItem = z.infer<typeof SurveyListItemSchema>;
export type SurveyQuestion = z.infer<typeof SurveyQuestionSchema>;
export type SurveyEventStats = z.infer<typeof SurveyEventStatsSchema>;
export type SurveyRates = z.infer<typeof SurveyRatesSchema>;
export type SurveyStats = z.infer<typeof SurveyStatsSchema>;
export type SurveyResponseStats = z.infer<typeof SurveyResponseStatsSchema>;
export type GetSurveyStatsInput = z.infer<typeof GetSurveyStatsInputSchema>;
export type GetSurveySpecificStatsInput = z.infer<typeof GetSurveySpecificStatsInputSchema>;
