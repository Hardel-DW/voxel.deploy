# CLAUDE.md
This file provides guidance to Claude Code (claude.ai/code) when working with
code in this repository.

We want to create a CLI that generates a *.md file in the .changeset/ folder with parameters, which allows deployment to Minecraft Modrinth and CurseForge.
Parameters:
- game_versions (minecraft versions)
- version_type (release, beta, alpha)
- version_bump (major, minor, patch)

How to use it:
1. Install it with `npm install -g @voxelio/deploy`
2. Use it with `npx voxset`

## Development Commands

- **Lint/Typecheck**: `npm run lint` - Run TypeScript compiler without emit for
  type checking
- **Format**: `npm run biome:format` - Format code with Biome
- **Lint check**: `npm run biome:check` - Check code with Biome linter
- **Auto-fix**: `npm run biome:unsafefix` - Auto-fix with Biome (unsafe)

## Architecture Overview

This is a Node.js CLI tool that automates deployment of Minecraft datapacks to Modrinth and CurseForge. The CLI guides users through:
1. Initial setup (deploy.yml config + GitHub workflow)
2. Creating changesets (markdown files with version bump info)
3. GitHub Actions workflow handles the actual deployment

### Core Technologies

- **Runtime**: Node.js >= 22.0.0
- **Language**: TypeScript 5.9+
- **CLI Framework**: @clack/prompts (interactive prompts)
- **Schema Validation**: arktype (runtime type validation)
- **YAML Parsing**: yaml package
- **Build Tool**: tsdown (TypeScript bundler)
- **Linting/Formatting**: Biome (replaces ESLint/Prettier)

### Project Structure

```
src/
├── cli.ts              # CLI entry point (shebang + init command)
├── index.ts            # Programmatic API exports
├── commands/
│   └── init.ts         # Main command: setup + changeset creation
├── utils/
│   ├── changeset.ts    # Create changeset markdown files
│   ├── config.ts       # Read/write deploy.yml config
│   ├── datapack.ts     # Validate pack.mcmeta structure
│   ├── frontmatter.ts  # Parse YAML frontmatter from markdown
│   └── workflow.ts     # Create GitHub Actions workflow
└── types/
    └── schema.ts       # TypeScript types + arktype schemas

examples/
├── deploy.yml          # GitHub workflow template
├── example.yaml        # Example deploy.yml config
└── happy-pandas-dance.md  # Example changeset

dist/                   # Built output (tsdown)
```

Rules:
- No code redundancy.
- No "any" type. For type "unknown", it is preferable to request authorization.
- Avoid globalthis.
- Prefer modern and standards logic 2024 abb 2025.
- Do not implement more features than requested.
- After the third time with the same problem, try to think of a simple solution and a complete solution, which may require redoing a large part of the work.
- Methods must be less than 10 lines of code and must do one thing correctly.
- No Legacy or Deprecated support.
- At the end of each sessions, check with `npm run lint`