import crypto from "node:crypto";

export function hash(data: string) {
	return crypto.createHash("sha256").update(data).digest("hex");
}
