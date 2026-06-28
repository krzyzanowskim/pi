import { type Args, parseArgs } from "./cli/args.ts";

export const HEADLESS_UNSUPPORTED_MESSAGE =
	"Headless binary does not support interactive mode. Use -p, --mode json, or --mode rpc.";

export type HeadlessValidationResult = { ok: true } | { ok: false; message: string };

export function isHeadlessMetadataCommand(parsed: Pick<Args, "help" | "listModels" | "print" | "mode">): boolean {
	return !parsed.print && parsed.mode === undefined && (parsed.help === true || parsed.listModels !== undefined);
}

export function validateHeadlessArgs(args: string[]): HeadlessValidationResult {
	const parsed = parseArgs(args);
	if (isHeadlessMetadataCommand(parsed) || parsed.version) {
		return { ok: true };
	}
	if (parsed.print || parsed.mode === "json" || parsed.mode === "rpc") {
		return { ok: true };
	}
	return { ok: false, message: HEADLESS_UNSUPPORTED_MESSAGE };
}

export function isHeadlessRuntime(): boolean {
	return process.env.PI_HEADLESS === "1" || process.env.PI_HEADLESS?.toLowerCase() === "true";
}
