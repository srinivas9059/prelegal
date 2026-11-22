import { readFile } from "node:fs/promises";
import path from "node:path";
import NdaCreator from "./NdaCreator";

// The agreement templates live in the repo-root `templates/` directory
// (the single source of truth); this app runs from `frontend/`.
const TEMPLATES_DIR = path.join(process.cwd(), "..", "templates");

async function loadTemplates() {
  "use cache";
  const [coverTemplate, termsTemplate] = await Promise.all([
    readFile(path.join(TEMPLATES_DIR, "Mutual-NDA-coverpage.md"), "utf8"),
    readFile(path.join(TEMPLATES_DIR, "Mutual-NDA.md"), "utf8"),
  ]);
  return { coverTemplate, termsTemplate };
}

export default async function Home() {
  const { coverTemplate, termsTemplate } = await loadTemplates();

  return (
    <NdaCreator coverTemplate={coverTemplate} termsTemplate={termsTemplate} />
  );
}
