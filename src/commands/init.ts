import { spawn } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import * as clack from "@clack/prompts";
import type { ChangesetFrontmatter, VersionBump, VersionType } from "@/types/schema";
import { createChangeset } from "@/utils/changeset";
import { configExists, createDefaultConfig, writeConfig } from "@/utils/config";
import { isValidDatapack } from "@/utils/datapack";
import { createWorkflow, workflowExists } from "@/utils/workflow";

const MINECRAFT_VERSIONS = [
    "1.21.10",
    "1.21.9",
    "1.21.8",
    "1.21.7",
    "1.21.6",
    "1.21.5",
    "1.21.4",
    "1.21.3",
    "1.21.2",
    "1.21.1",
    "1.21",
    "1.20.6",
    "1.20.5",
    "1.20.4",
    "1.20.3",
    "1.20.2",
    "1.20.1",
    "1.20"
];

export async function init(): Promise<void> {
    const isDatapack = await isValidDatapack();
    if (!isDatapack) {
        clack.log.error(
            "The current directory is not a valid datapack. Check that there is a pack.mcmeta file with a 'description' and 'pack_format' field."
        );
        process.exit(1);
    }

    const hasConfig = await configExists();
    const hasWorkflow = await workflowExists();

    if (!hasConfig) {
        await runFullSetup();
    } else if (!hasWorkflow) {
        clack.intro("Voxelio Deploy");

        const spinner = clack.spinner();
        spinner.start("Creating workflow file...");
        await createWorkflow();
        spinner.stop("Workflow file created successfully!");

        clack.note(
            "Ready to create a new changeset.\n\nThis will create a markdown file in the .changeset folder.\nThe deployment will be triggered on the next commit containing this file.",
            "Create Changeset"
        );

        const wantsChangeset = await clack.confirm({
            message: "Do you want to continue?"
        });

        if (clack.isCancel(wantsChangeset) || !wantsChangeset) {
            clack.cancel("Operation cancelled");
            process.exit(0);
        }

        await createNewChangeset();
        clack.outro("Changeset created successfully!");
    } else {
        clack.intro("Voxelio Deploy");

        clack.note(
            "Ready to create a new changeset.\n\nThis will create a markdown file in the .changeset folder.\nThe deployment will be triggered on the next commit containing this file.",
            "Create Changeset"
        );

        const wantsChangeset = await clack.confirm({
            message: "Do you want to continue?"
        });

        if (clack.isCancel(wantsChangeset) || !wantsChangeset) {
            clack.cancel("Operation cancelled");
            process.exit(0);
        }

        await createNewChangeset();
        clack.outro("Changeset created successfully!");
    }
}

async function runFullSetup(): Promise<void> {
    clack.intro("Voxelio Deploy - Configuration");

    clack.note(
        "Hello, welcome to the Voxelio Deploy configuration. We will prepare the environment together to easily deploy to Modrinth and CurseForge.\n\nA few things to know:\n- If you want to stop, you can press Escape or Ctrl+C\n- You will need a Modrinth and/or CurseForge account",
        "Welcome"
    );

    const continueSetup = await clack.confirm({
        message: "Ready to start configuration?"
    });

    if (clack.isCancel(continueSetup) || !continueSetup) {
        clack.cancel("Configuration cancelled");
        process.exit(0);
    }

    clack.note(
        'Don\'t forget to set environment variables in your GitHub project!\n\nYou need to define in Settings > Secrets and Variables > Actions > Secrets > Repository secrets:\n- CURSEFORGE_TOKEN: https://legacy.curseforge.com/account/api-tokens\n- MODRINTH_TOKEN: https://modrinth.com/settings/pats with "Create Version" permission',
        "Environment Variables"
    );

    const envVarConfirm = await clack.confirm({
        message: "All set, shall we continue?"
    });

    if (clack.isCancel(envVarConfirm) || !envVarConfirm) {
        clack.cancel("Configuration cancelled");
        process.exit(0);
    }

    clack.note(
        "Do you want your datapack to be automatically converted to a mod?\n\n- For Modrinth this will create 2 versions on the same project\n- For CurseForge this will create 2 separate projects",
        "Package as mod"
    );

    const packageAsMod = await clack.confirm({
        message: "Do you want package your datapack as a mod?"
    });

    if (clack.isCancel(packageAsMod)) {
        clack.cancel("Configuration cancelled");
        process.exit(0);
    }

    const platformOptions = [{ value: "modrinth", label: "Modrinth" }];

    if (packageAsMod) {
        platformOptions.push({ value: "curseforge_datapack", label: "CurseForge (Datapack)" });
        platformOptions.push({ value: "curseforge_mod", label: "CurseForge (Mod)" });
    }

    if (!packageAsMod) {
        platformOptions.push({ value: "curseforge_datapack", label: "CurseForge" });
    }

    const platforms = await clack.multiselect({
        message: "Choose platforms",
        options: platformOptions,
        required: true
    });

    if (clack.isCancel(platforms)) {
        clack.cancel("Configuration cancelled");
        process.exit(0);
    }

    const projectName = await clack.text({
        message: "Project name (appears in CurseForge)",
        placeholder: "My Datapack",
        validate: (value) => (value.length === 0 ? "Required" : undefined)
    });

    if (clack.isCancel(projectName)) {
        clack.cancel("Configuration cancelled");
        process.exit(0);
    }

    const versionPreview = "1.0.0";

    const projectFilename = await clack.text({
        message: `Project Filename (For zipped datapack) - Preview: ${projectName}-${versionPreview}.zip`,
        placeholder: projectName as string,
        defaultValue: projectName as string
    });

    if (clack.isCancel(projectFilename)) {
        clack.cancel("Configuration cancelled");
        process.exit(0);
    }

    let modFilename = projectFilename;
    if (packageAsMod) {
        const modFilenameInput = await clack.text({
            message: `Mod Filename (For JAR file) - Preview: ${projectFilename}-${versionPreview}.jar`,
            placeholder: projectFilename as string,
            defaultValue: projectFilename as string
        });

        if (clack.isCancel(modFilenameInput)) {
            clack.cancel("Configuration cancelled");
            process.exit(0);
        }

        modFilename = modFilenameInput;
    }

    const version = await clack.text({
        message: "Initial version",
        placeholder: "1.0.0",
        defaultValue: "1.0.0",
        validate: (value) => (value.length === 0 || /^\d+\.\d+\.\d+$/.test(value) ? undefined : "Format: X.Y.Z")
    });

    if (clack.isCancel(version)) {
        clack.cancel("Configuration cancelled");
        process.exit(0);
    }

    const config = createDefaultConfig();
    config.project.name = projectName as string;
    config.project.filename = projectFilename as string;
    config.project.version = version as string;

    const platformList = platforms as string[];

    if (platformList.includes("modrinth")) {
        const modrinthId = await clack.text({
            message: "Modrinth Project ID - https://modrinth.com/dashboard/projects",
            placeholder: "AABBCCDD",
            validate: (value) => {
                if (value.length === 0) return "Required";
                if (value.length !== 8) return "Must be exactly 8 characters";
                return undefined;
            }
        });

        if (clack.isCancel(modrinthId)) {
            clack.cancel("Configuration cancelled");
            process.exit(0);
        }

        config.modrinth.enabled = true;
        config.modrinth.project_id = modrinthId as string;
    }

    if (platformList.includes("curseforge_datapack")) {
        const curseforgeDatapackId = await clack.text({
            message:
                "CurseForge Datapack Project ID - Can be found on the Public Page e.g https://www.curseforge.com/minecraft/mc-mods/neoenchant",
            placeholder: "12345678",
            validate: (value) => {
                if (value.length === 0) return "Required";
                if (!/^\d+$/.test(value)) return "Must be a number";
                return undefined;
            }
        });

        if (clack.isCancel(curseforgeDatapackId)) {
            clack.cancel("Configuration cancelled");
            process.exit(0);
        }

        config.curseforge.datapack.enabled = true;
        config.curseforge.datapack.project_id = Number.parseInt(curseforgeDatapackId as string, 10);
    }

    if (platformList.includes("curseforge_mod")) {
        const curseforgeModId = await clack.text({
            message: "CurseForge Mod Project ID",
            placeholder: "12345678",
            validate: (value) => {
                if (value.length === 0) return "Required";
                if (!/^\d+$/.test(value)) return "Must be a number";
                return undefined;
            }
        });

        if (clack.isCancel(curseforgeModId)) {
            clack.cancel("Configuration cancelled");
            process.exit(0);
        }

        config.curseforge.mod.enabled = true;
        config.curseforge.mod.project_id = Number.parseInt(curseforgeModId as string, 10);
    }

    if (packageAsMod) {
        config.package_as_mod.enabled = true;
        config.package_as_mod.filename = modFilename as string;

        const loaders = await clack.multiselect({
            message: "Mod loaders",
            options: [
                { value: "fabric", label: "Fabric" },
                { value: "forge", label: "Forge" },
                { value: "neoforge", label: "NeoForge" },
                { value: "quilt", label: "Quilt" }
            ],
            required: true
        });

        if (clack.isCancel(loaders)) {
            clack.cancel("Configuration cancelled");
            process.exit(0);
        }

        config.package_as_mod.loaders = loaders as string[];

        const modId = await clack.text({
            message: "Mod ID",
            placeholder: toCamelCase(projectName as string),
            defaultValue: toCamelCase(projectName as string)
        });

        if (clack.isCancel(modId)) {
            clack.cancel("Configuration cancelled");
            process.exit(0);
        }

        config.package_as_mod.id = modId as string;
    }

    const wantsExtra = await clack.confirm({
        message: "Do you want to configure additional information (author, homepage, sources, issues)?"
    });

    if (clack.isCancel(wantsExtra)) {
        clack.cancel("Configuration cancelled");
        process.exit(0);
    }

    if (wantsExtra) {
        const authors = await clack.text({
            message: "Authors (comma-separated)",
            placeholder: "Author1, Author2"
        });

        if (!clack.isCancel(authors) && authors && (authors as string).trim() !== "") {
            config.package_as_mod.authors = (authors as string).split(",").map((a) => a.trim());
        }

        const homepage = await clack.text({
            message: "Homepage URL",
            placeholder: "https://example.com",
            validate: (value) => {
                if (!value || value.trim() === "") return undefined;
                if (!value.startsWith("https://")) return "Must start with https://";
                try {
                    const url = new URL(value);
                    if (!url.hostname.includes(".")) return "Must be a valid domain (e.g., example.com)";
                    return undefined;
                } catch {
                    return "Invalid URL format";
                }
            }
        });

        if (!clack.isCancel(homepage) && homepage && (homepage as string).trim() !== "") {
            config.package_as_mod.homepage = homepage as string;
        }

        const sources = await clack.text({
            message: "Sources URL",
            placeholder: "https://github.com/user/repo",
            validate: (value) => {
                if (!value || value.trim() === "") return undefined;
                if (!value.startsWith("https://")) return "Must start with https://";
                try {
                    const url = new URL(value);
                    if (!url.hostname.includes(".")) return "Must be a valid domain (e.g., github.com)";
                    return undefined;
                } catch {
                    return "Invalid URL format";
                }
            }
        });

        if (!clack.isCancel(sources) && sources && (sources as string).trim() !== "") {
            config.package_as_mod.sources = sources as string;
        }

        const issues = await clack.text({
            message: "Issues URL",
            placeholder: "https://github.com/user/repo/issues",
            validate: (value) => {
                if (!value || value.trim() === "") return undefined;
                if (!value.startsWith("https://")) return "Must start with https://";
                try {
                    const url = new URL(value);
                    if (!url.hostname.includes(".")) return "Must be a valid domain (e.g., github.com)";
                    return undefined;
                } catch {
                    return "Invalid URL format";
                }
            }
        });

        if (!clack.isCancel(issues) && issues && (issues as string).trim() !== "") {
            config.package_as_mod.issues = issues as string;
        }
    }

    const spinner = clack.spinner();
    spinner.start("Creating configuration...");

    await writeConfig(config);
    await createWorkflow();

    spinner.stop("Configuration created successfully!");

    clack.note(
        "The deploy.yaml file has been created at the root of your project.\n\nYou can edit this file to configure advanced settings such as:\n- Excluding files from the build\n- Java versions for CurseForge\n- Environment settings (client/server)\n- And more...",
        "Configuration Complete"
    );

    clack.outro("Thank you for your participation, we're done! 🎉");

    const wantsChangeset = await clack.confirm({
        message: "Do you want to create a changeset now?\n\n  (It will be deployed on the next commit)"
    });

    if (clack.isCancel(wantsChangeset) || !wantsChangeset) {
        return;
    }

    clack.intro("Create Changeset");
    await createNewChangeset();
    clack.outro("Changeset created successfully!");
}

async function createNewChangeset(): Promise<void> {
    const gameVersions = await clack.multiselect({
        message: "Select Minecraft versions",
        options: MINECRAFT_VERSIONS.map((version) => ({
            value: version,
            label: version
        })),
        required: true
    });

    if (clack.isCancel(gameVersions)) {
        clack.cancel("Operation cancelled");
        process.exit(0);
    }

    const versionType = await clack.select({
        message: "Version type",
        options: [
            { value: "release", label: "Release" },
            { value: "beta", label: "Beta" },
            { value: "alpha", label: "Alpha" }
        ]
    });

    if (clack.isCancel(versionType)) {
        clack.cancel("Operation cancelled");
        process.exit(0);
    }

    const versionBump = await clack.select({
        message: "Version bump",
        options: [
            { value: "patch", label: "Patch (0.0.X)" },
            { value: "minor", label: "Minor (0.X.0)" },
            { value: "major", label: "Major (X.0.0)" }
        ]
    });

    if (clack.isCancel(versionBump)) {
        clack.cancel("Operation cancelled");
        process.exit(0);
    }

    let changelog = await clack.text({
        message: "Changelog (press Enter to open editor)",
        placeholder: "Added new features..."
    });

    if (clack.isCancel(changelog)) {
        clack.cancel("Operation cancelled");
        process.exit(0);
    }

    if (!changelog || (changelog as string).trim() === "") {
        clack.note("Opening editor...\n\n⚠️  IMPORTANT: Save your changes (Ctrl+S) before closing the editor!", "Editor");

        const editedChangelog = await openEditor();

        if (editedChangelog === null) {
            clack.cancel("Operation cancelled");
            process.exit(0);
        }

        if (editedChangelog.trim() === "") {
            clack.log.error("Changelog cannot be empty. Please provide a changelog.");
            process.exit(1);
        }

        changelog = editedChangelog;
    }

    const frontmatter: ChangesetFrontmatter = {
        game_versions: gameVersions as string[],
        version_type: versionType as VersionType,
        version_bump: versionBump as VersionBump
    };

    const filepath = await createChangeset(frontmatter, changelog as string);
    clack.log.success(`Created ${filepath}`);
}

async function openEditor(): Promise<string | null> {
    const tmpFile = join(tmpdir(), `voxset-${Date.now()}.md`);
    await writeFile(tmpFile, "# Write your changelog here\n", "utf-8");

    const editor = process.env.EDITOR || (process.platform === "win32" ? "notepad" : "nano");

    return new Promise((resolve) => {
        const child = spawn(editor, [tmpFile], { stdio: "inherit" });

        child.on("exit", async (code) => {
            if (code === 0) {
                const { readFile } = await import("node:fs/promises");
                const content = await readFile(tmpFile, "utf-8");
                const cleaned = content.replace(/^# Write your changelog here\n/, "").trim();
                resolve(cleaned);
            } else {
                resolve(null);
            }
        });
    });
}

function toCamelCase(str: string): string {
    return str
        .toLowerCase()
        .replace(/[^a-z0-9]+(.)/g, (_, char) => char.toUpperCase())
        .replace(/^(.)/, (char) => char.toLowerCase());
}
