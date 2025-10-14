import { mkdir, writeFile } from "node:fs/promises";
import type { ChangesetFrontmatter } from "@/types/schema";
import { createMarkdownWithFrontmatter } from "@/utils/frontmatter";

const CHANGESET_DIR = ".changeset";

export async function createChangeset(data: ChangesetFrontmatter, changelog: string): Promise<string> {
    await mkdir(CHANGESET_DIR, { recursive: true });

    const filename = generateChangesetFilename();
    const filepath = `${CHANGESET_DIR}/${filename}`;
    const content = createMarkdownWithFrontmatter(data, changelog);

    await writeFile(filepath, content, "utf-8");

    return filepath;
}

function generateChangesetFilename(): string {
    const adjectives = ["happy", "silly", "brave", "calm", "bright", "clever", "fair", "gentle", "kind", "lovely"];
    const nouns = ["pandas", "tigers", "dragons", "wolves", "eagles", "foxes", "bears", "lions", "owls", "hawks"];
    const verbs = ["dance", "jump", "fly", "swim", "run", "sing", "play", "rest", "hunt", "soar"];

    const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const verb = verbs[Math.floor(Math.random() * verbs.length)];

    return `${adj}-${noun}-${verb}.md`;
}
