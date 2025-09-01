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

// Single choice response branching - uses numeric choice indices (0, 1, 2, etc.)
const SingleChoiceResponseBranchingSchema = z
	.object({
		type: z.literal("response_based"),
		responseValues: z.record(z.string(), z.union([z.number(), z.literal("end")])),
	})
	.describe(
		'For single choice questions: use choice indices as string keys ("0", "1", "2", etc.)',
	);

// NPS rating response branching - uses sentiment categories
const NPSResponseBranchingSchema = z
	.object({
		type: z.literal("response_based"),
		responseValues: z.record(
			z.enum(["detractors", "passives", "promoters"]),
			z.union([z.number(), z.literal("end")]),
		),
	})
	.describe(
		'For NPS rating questions: use sentiment keys ("detractors", "passives", "promoters")',
	);

// General sentiment values
const GeneralSentimentEnum = z.enum(["negative", "neutral", "positive"]);

// Match type enum for URL and device type targeting
const MatchTypeEnum = z.enum([
	"regex",
	"not_regex",
	"exact",
	"is_not",
	"icontains",
	"not_icontains",
]);

// General rating response branching - uses sentiment categories
const GeneralSentimentResponseBranchingSchema = z
	.object({
		type: z.literal("response_based"),
		responseValues: z.record(GeneralSentimentEnum, z.union([z.number(), z.literal("end")])),
	})
	.describe(
		'For general rating questions: use sentiment keys ("negative", "neutral", "positive")',
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
	display: z.enum(["number", "emoji"]).optional(),
	scale: z.number().optional(),
	lowerBoundLabel: z.string().optional(),
	upperBoundLabel: z.string().optional(),
	branching: GeneralSentimentBranchingSchema.optional(),
});

const NPSRatingQuestionSchema = BaseSurveyQuestionSchema.extend({
	type: z.literal("rating"),
	display: z.enum(["number", "emoji"]).optional(),
	scale: z.literal(10),
	lowerBoundLabel: z.string().optional(),
	upperBoundLabel: z.string().optional(),
	branching: NPSBranchingSchema.optional(),
});

const SingleChoiceQuestionSchema = BaseSurveyQuestionSchema.extend({
	type: z.literal("single_choice"),
	choices: z.array(z.string()),
	shuffleOptions: z.boolean().optional(),
	hasOpenChoice: z.boolean().optional(),
	branching: BaseBranchingSchema.optional(),
});

const MultipleChoiceQuestionSchema = BaseSurveyQuestionSchema.extend({
	type: z.literal("multiple_choice"),
	choices: z.array(z.string()),
	shuffleOptions: z.boolean().optional(),
	hasOpenChoice: z.boolean().optional(),
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
	seenSurveyWaitPeriodInDays: z.number().optional(),
	urlMatchType: MatchTypeEnum.optional(),
	events: z
		.object({
			repeatedActivation: z.boolean().optional(),
			values: z
				.array(
					z.object({
						name: z.string(),
					}),
				)
				.optional(),
		})
		.optional(),
	actions: z
		.object({
			values: z
				.array(
					z.object({
						id: z.number(),
						name: z.string().optional(),
						steps: z.array(z.any()).optional(),
					}),
				)
				.optional(),
		})
		.optional(),
	deviceTypes: z.array(z.string()).optional(),
	deviceTypesMatchType: MatchTypeEnum.optional(),
	linkedFlagVariant: z.string().optional(),
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
	start_date: z.string().datetime().optional(),
	end_date: z.string().datetime().optional(),
	archived: z.boolean().optional(),
	responses_limit: z.number().nullable().optional(),
	iteration_count: z.number().nullable().optional(),
	iteration_frequency_days: z.number().nullable().optional(),
	enable_partial_responses: z.boolean().optional(),
});

export const UpdateSurveyInputSchema = z.object({
	name: z.string().optional(),
	description: z.string().optional(),
	type: z.enum(["popover", "api", "widget", "external_survey"]).optional(),
	questions: z.array(SurveyQuestionSchema).optional(),
	conditions: SurveyConditionsSchema.optional(),
	appearance: SurveyAppearanceSchema.optional(),
	schedule: z.enum(["once", "recurring", "always"]).optional(),
	start_date: z.string().datetime().optional(),
	end_date: z.string().datetime().optional(),
	archived: z.boolean().optional(),
	responses_limit: z.number().nullable().optional(),
	iteration_count: z.number().nullable().optional(),
	iteration_frequency_days: z.number().nullable().optional(),
	response_sampling_start_date: z.string().datetime().optional(),
	response_sampling_interval_type: z.enum(["day", "week", "month"]).optional(),
	response_sampling_interval: z.number().nullable().optional(),
	response_sampling_limit: z.number().nullable().optional(),
	enable_partial_responses: z.boolean().optional(),
});

export const ListSurveysSchema = z.object({
	limit: z.number().optional(),
	offset: z.number().optional(),
	search: z.string().optional(),
});

// Survey response schemas
export const SurveySchema = z.object({
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
	iteration_count: z.number().nullable().optional(),
	iteration_frequency_days: z.number().nullable().optional(),
});

export type CreateSurveyInput = z.infer<typeof CreateSurveyInputSchema>;
export type UpdateSurveyInput = z.infer<typeof UpdateSurveyInputSchema>;
export type ListSurveysData = z.infer<typeof ListSurveysSchema>;
export type Survey = z.infer<typeof SurveySchema>;
export type SurveyListItem = z.infer<typeof SurveyListItemSchema>;
export type SurveyQuestion = z.infer<typeof SurveyQuestionSchema>;
