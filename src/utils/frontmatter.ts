import { parse, stringify } from "yaml";
import type { ChangesetFrontmatter } from "@/types/schema";

export function parseMarkdownFrontmatter(content: string): { data: ChangesetFrontmatter; content: string } {
    const match = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!match) {
        throw new Error("Invalid markdown frontmatter format");
    }

    const [, frontmatter, markdownContent] = match;
    const data = parse(frontmatter) as ChangesetFrontmatter;

    return {
        data,
        content: markdownContent.trim()
    };
}

export function createMarkdownWithFrontmatter(data: ChangesetFrontmatter, content: string): string {
    const frontmatter = stringify(data);
    return `---\n${frontmatter}---\n\n${content}`;
}
