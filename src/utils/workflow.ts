import { access, constants, copyFile, mkdir } from "node:fs/promises";
import { dirname, join } from "node:path";
import { cwd } from "node:process";
const WORKFLOW_PATH = ".github/workflows/voxset.yaml";

function getExampleWorkflowPath(): string {
    console.log(cwd());
    return join(cwd(), "examples", "deploy.yml");
}

export async function workflowExists(): Promise<boolean> {
    try {
        await access(WORKFLOW_PATH, constants.F_OK);
        return true;
    } catch {
        return false;
    }
}

export async function createWorkflow(): Promise<void> {
    const dir = dirname(WORKFLOW_PATH);
    await mkdir(dir, { recursive: true });
    const examplePath = getExampleWorkflowPath();
    await copyFile(examplePath, WORKFLOW_PATH);
}
