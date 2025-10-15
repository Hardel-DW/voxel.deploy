# @voxelio/deploy
A CLI tool that automates deployment of Minecraft datapacks to Modrinth and CurseForge using GitHub Actions, The CLI will guide you through the setup (first time) or changeset creation (subsequent runs).

## Installation
```bash
npm install -g @voxelio/deploy
```

## Usage
Navigate to your datapack directory and run:
```bash
npx voxset
```
---

## First Time Setup
The CLI now guides you through creating a default configuration file for your project. It automatically generates:
- A `deploy.yml` configuration file at your project root
- GitHub Actions workflow files integrated into your repository

You need to define in Settings > Secrets and Variables > Actions > Secrets > Repository secrets: `CURSEFORGE_TOKEN` and `MODRINTH_TOKEN`.
- To get `CURSEFORGE_TOKEN`, go to https://legacy.curseforge.com/account/api-tokens and generate a token.
- To get `MODRINTH_TOKEN`, go to https://modrinth.com/settings/pats with "Create Version" permission, which is sufficient.

## Subsequent Deployments
After the initial setup, the CLI simply prompts you to create a new version—**simple, fast, and efficient**. No configuration needed, just deploy.

## Mod Packaging
The "package as mod" feature offered by Modrinth is handled by my `@voxelio/converter` library. Since there may be subtle differences between Modrinth's implementation and mine, please report any discrepancies you encounter so I can refine the converter.

## How to use
Like changeset, it works similarly: when a `*.md` file is published in a commit in the `.changeset` folder, it triggers the deployment, automatically increments the version, and deletes files in the `.changeset` folder.
The markdown file content will be used on Modrinth and CurseForge. You must specify Minecraft versions with `game_versions`, the release type `version_type` (beta or release), and which version number to increment `version_bump: patch|minor|major`.
