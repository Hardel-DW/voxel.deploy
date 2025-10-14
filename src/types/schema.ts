import { type } from "arktype";

export const VersionBump = type("'major'|'minor'|'patch'");
export type VersionBump = typeof VersionBump.infer;

export const VersionType = type("'release'|'beta'|'alpha'");
export type VersionType = typeof VersionType.infer;

export const GameVersion = type("string");
export type GameVersion = typeof GameVersion.infer;

export const Loader = type("'fabric'|'forge'|'neoforge'|'quilt'");
export type Loader = typeof Loader.infer;

export const ChangesetFrontmatter = type({
    game_versions: "string[]",
    version_type: VersionType,
    version_bump: VersionBump,
    "loaders?": "string[]"
});
export type ChangesetFrontmatter = typeof ChangesetFrontmatter.infer;

export const DeployConfig = type({
    project: {
        version: "string",
        name: "string",
        filename: "string"
    },
    modrinth: {
        enabled: "boolean",
        project_id: "string",
        "featured?": "boolean"
    },
    curseforge: {
        datapack: {
            enabled: "boolean",
            "project_id?": "number | null"
        },
        mod: {
            enabled: "boolean",
            "project_id?": "number | null",
            "java_versions?": "string[]",
            "environments?": "string[]"
        }
    },
    package_as_mod: {
        enabled: "boolean",
        loaders: "string[]",
        id: "string",
        "filename?": "string",
        authors: "string[]",
        "homepage?": "string",
        "issues?": "string",
        "sources?": "string"
    },
    "build?": {
        "exclude?": "string[]"
    }
});
export type DeployConfig = typeof DeployConfig.infer;
