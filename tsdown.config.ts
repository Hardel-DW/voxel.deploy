import { defineConfig } from "tsdown";

export default defineConfig({
    entry: ["./src/cli.ts", "./src/index.ts"],
    format: ["esm"],
    dts: true,
    minify: true,
    shims: true,
    platform: "node"
});
