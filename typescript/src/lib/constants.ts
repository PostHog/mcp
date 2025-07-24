export const DEV = process.env.NODE_ENV === 'development';

export const BASE_URL = DEV ? "http://localhost:8010" : "https://us.posthog.com";
