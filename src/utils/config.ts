import { access, constants, readFile, writeFile } from "node:fs/promises";
import { parse, stringify } from "yaml";
import { DeployConfig } from "@/types/schema";

export async function configExists(): Promise<boolean> {
    try {
        await access("deploy.yaml", constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

export async function readConfig(): Promise<DeployConfig> {
    const content = await readFile("deploy.yaml", "utf-8");
    const config = parse(content);
    const validation = DeployConfig(config);
    if (validation instanceof Error) {
        throw new Error(`Invalid deploy.yaml: ${validation.message}`);
    }

    return validation as DeployConfig;
}

export async function writeConfig(config: DeployConfig): Promise<void> {
    const validation = DeployConfig(config);
    if (validation instanceof Error) {
        throw new Error(`Invalid config: ${validation.message}`);
    }

    const content = stringify(config);
    await writeFile("deploy.yaml", content, "utf-8");
}

export function createDefaultConfig(): DeployConfig {
    return {
        project: {
            version: "0.1.0",
            name: "",
            filename: ""
        },
        modrinth: {
            enabled: false,
            project_id: "",
            featured: false
        },
        curseforge: {
            datapack: {
                enabled: false,
                project_id: null
            },
            mod: {
                enabled: false,
                project_id: null,
                java_versions: ["Java 21"],
                environments: ["server"]
            }
        },
        package_as_mod: {
            enabled: false,
            loaders: ["fabric", "forge", "neoforge", "quilt"],
            id: "",
            authors: []
        },
        build: {
            exclude: [".git", ".github", ".changeset", ".vscode", ".cursor", "node_modules", "README.md", ".gitignore", "deploy.yaml"]
        }
    };
}
