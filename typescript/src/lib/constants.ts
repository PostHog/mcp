import { env } from "cloudflare:workers";

export const DEV = false;

export const BASE_URL =
	env.POSTHOG_BASE_URL || (DEV ? "http://localhost:8010" : "https://us.posthog.com");
