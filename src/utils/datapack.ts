import { access, constants, readFile } from "node:fs/promises";

interface PackMcmeta {
    pack?: {
        description?: string;
    };
}

export async function isValidDatapack(): Promise<boolean> {
    try {
        await access("pack.mcmeta", constants.F_OK);
        const content = await readFile("pack.mcmeta", "utf-8");
        const data = JSON.parse(content) as PackMcmeta;
        return !!data.pack?.description;
    } catch {
        return false;
    }
}
