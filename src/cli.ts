#!/usr/bin/env node
import { init } from "@/commands/init";

try {
    await init();
} catch (error) {
    console.error("Error:", error instanceof Error ? error.message : error);
    process.exit(1);
}
