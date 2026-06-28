#!/usr/bin/env node
import "./restore-sandbox-env-preload.ts";
import "./register-bedrock.ts";
import { APP_NAME } from "../config.ts";
import { HEADLESS_UNSUPPORTED_MESSAGE, validateHeadlessArgs } from "../headless.ts";
import { main } from "../main.ts";

process.title = APP_NAME;
process.env.PI_CODING_AGENT = "true";
process.env.PI_HEADLESS = "1";
process.emitWarning = (() => {}) as typeof process.emitWarning;

const validation = validateHeadlessArgs(process.argv.slice(2));
if (!validation.ok) {
	console.error(`Error: ${validation.message || HEADLESS_UNSUPPORTED_MESSAGE}`);
	process.exit(1);
}

main(process.argv.slice(2));
