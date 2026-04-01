/**
 * Analyze hackathon submission metadata from exported CSV.
 * Run: npx tsx scripts/analysis/analyze-submissions.ts
 */
import { readFileSync } from "fs";
import { resolve } from "path";

const CSV_PATH = resolve(__dirname, "projects.csv");

// --- Minimal RFC 4180 CSV parser (handles quoted fields with newlines) ------
function parseCSV(text: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;
  let i = 0;

  while (i < text.length) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i += 2;
        } else {
          inQuotes = false;
          i++;
        }
      } else {
        field += ch;
        i++;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
        i++;
      } else if (ch === ",") {
        row.push(field);
        field = "";
        i++;
      } else if (ch === "\n" || (ch === "\r" && text[i + 1] === "\n")) {
        row.push(field);
        field = "";
        rows.push(row);
        row = [];
        i += ch === "\r" ? 2 : 1;
      } else {
        field += ch;
        i++;
      }
    }
  }
  if (field || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  const [header, ...dataRows] = rows;
  return dataRows
    .filter((r) => r.length === header.length)
    .map((r) => {
      const obj: Record<string, string> = {};
      header.forEach((h, idx) => (obj[h] = r[idx]));
      return obj;
    });
}

// --- Helpers ----------------------------------------------------------------
function counter<T>(items: T[]): Map<T, number> {
  const map = new Map<T, number>();
  for (const item of items) map.set(item, (map.get(item) ?? 0) + 1);
  return map;
}

function topN(map: Map<string, number>, n = 20): [string, number][] {
  return [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n);
}

function printTable(
  title: string,
  entries: [string, number][],
  total?: number,
) {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`  ${title}`);
  console.log(`${"=".repeat(70)}`);
  const maxLabel = Math.max(...entries.map(([l]) => l.length), 5);
  for (const [label, count] of entries) {
    const pct = total ? ` (${((count / total) * 100).toFixed(1)}%)` : "";
    console.log(`  ${label.padEnd(maxLabel)}  ${String(count).padStart(5)}${pct}`);
  }
}

// --- Main -------------------------------------------------------------------
const raw = readFileSync(CSV_PATH, "utf-8");
const rows = parseCSV(raw);

console.log(`Total rows in CSV: ${rows.length}`);

const published = rows.filter((r) => r.status === "publish");
const drafts = rows.filter((r) => r.status === "draft");
console.log(`Published: ${published.length}, Drafts: ${drafts.length}`);

// Parse submission_metadata
type Meta = {
  model: string;
  tools: string[];
  skills: string[];
  intention: string;
  intentionNotes?: string;
  agentHarness: string;
  agentHarnessOther?: string;
  agentFramework: string;
  agentFrameworkOther?: string;
  helpfulResources?: string[];
  helpfulSkills?: { name: string; reason: string }[];
  commitCount?: number | null;
  firstCommitAt?: string | null;
  lastCommitAt?: string | null;
  contributorCount?: number | null;
  moltbookPostURL?: string;
};

const allMetas: { meta: Meta; status: string }[] = [];
let parseErrors = 0;

for (const row of rows) {
  const raw = row.submission_metadata;
  if (!raw) continue;
  try {
    const parsed = JSON.parse(raw) as Meta;
    allMetas.push({ meta: parsed, status: row.status });
  } catch {
    parseErrors++;
  }
}

console.log(
  `\nParsed metadata: ${allMetas.length} / ${rows.length} rows (${parseErrors} parse errors, ${rows.length - allMetas.length - parseErrors} missing metadata)`,
);

const publishedMetas = allMetas.filter((m) => m.status === "publish");
console.log(`Published with metadata: ${publishedMetas.length}`);

// Analyze on ALL submissions with metadata (draft + published)
const metas = allMetas.map((m) => m.meta);

// 1. Agent Frameworks
const frameworkCounts = counter(
  metas.map((m) => {
    if (m.agentFramework === "other" && m.agentFrameworkOther) {
      return `other: ${m.agentFrameworkOther}`;
    }
    return m.agentFramework;
  }),
);
printTable("Agent Frameworks (all submissions)", topN(frameworkCounts, 30), metas.length);

// Normalized frameworks (group "other" variants)
const normalizedFrameworks = counter(metas.map((m) => m.agentFramework));
printTable("Agent Frameworks (normalized)", topN(normalizedFrameworks), metas.length);

// 2. Agent Harnesses
const harnessCounts = counter(
  metas.map((m) => {
    if (m.agentHarness === "other" && m.agentHarnessOther) {
      return `other: ${m.agentHarnessOther}`;
    }
    return m.agentHarness;
  }),
);
printTable("Agent Harnesses (all submissions)", topN(harnessCounts, 30), metas.length);

const normalizedHarnesses = counter(metas.map((m) => m.agentHarness));
printTable("Agent Harnesses (normalized)", topN(normalizedHarnesses), metas.length);

// 3. Models
const normalizeModel = (m: string) =>
  m
    .trim()
    .toLowerCase()
    .replace(/[_\s]+/g, "-")
    .replace(/-+/g, "-");

const modelCounts = counter(metas.map((m) => normalizeModel(m.model)));
printTable("Models (top 30)", topN(modelCounts, 30), metas.length);

// Group by model family
const modelFamilyCounts = counter(
  metas.map((m) => {
    const norm = normalizeModel(m.model);
    if (norm.includes("claude")) return "Claude (Anthropic)";
    if (norm.includes("gpt") || norm.includes("openai") || norm.includes("o1") || norm.includes("o3") || norm.includes("o4"))
      return "GPT/OpenAI";
    if (norm.includes("gemini") || norm.includes("google")) return "Gemini (Google)";
    if (norm.includes("llama") || norm.includes("meta")) return "Llama (Meta)";
    if (norm.includes("deepseek")) return "DeepSeek";
    if (norm.includes("grok") || norm.includes("xai")) return "Grok (xAI)";
    if (norm.includes("mistral")) return "Mistral";
    if (norm.includes("qwen")) return "Qwen (Alibaba)";
    if (norm.includes("minimax")) return "MiniMax";
    if (norm.includes("cohere") || norm.includes("command")) return "Cohere";
    return `Other: ${m.model}`;
  }),
);
printTable("Model Families", topN(modelFamilyCounts, 20), metas.length);

// 4. Skills
const allSkills: string[] = [];
for (const m of metas) {
  if (Array.isArray(m.skills)) allSkills.push(...m.skills);
}
const skillNorm = (s: string) => s.trim().toLowerCase();
const skillCounts = counter(allSkills.map(skillNorm));
printTable(
  `Skills (top 30) — ${allSkills.length} total mentions across ${metas.length} projects`,
  topN(skillCounts, 30),
  metas.length,
);

// 5. Tools
const allTools: string[] = [];
for (const m of metas) {
  if (Array.isArray(m.tools)) allTools.push(...m.tools);
}
const toolNorm = (s: string) => s.trim().toLowerCase();
const toolCounts = counter(allTools.map(toolNorm));
printTable(
  `Tools (top 40) — ${allTools.length} total mentions across ${metas.length} projects`,
  topN(toolCounts, 40),
  metas.length,
);

// 6. Intentions
const intentionCounts = counter(metas.map((m) => m.intention));
printTable("Intentions", topN(intentionCounts), metas.length);

// 7. Intention Notes (sample)
const notes = metas
  .filter((m) => m.intentionNotes && m.intentionNotes.trim().length > 0)
  .map((m) => m.intentionNotes!.trim());
console.log(`\n${"=".repeat(70)}`);
console.log(`  Intention Notes: ${notes.length} submissions provided notes`);
console.log(`${"=".repeat(70)}`);
for (const note of notes.slice(0, 20)) {
  console.log(`  - ${note.slice(0, 200)}${note.length > 200 ? "..." : ""}`);
}

// 8. Helpful Skills
const allHelpfulSkills: { name: string; reason: string }[] = [];
for (const m of metas) {
  if (Array.isArray(m.helpfulSkills)) allHelpfulSkills.push(...m.helpfulSkills);
}
const helpfulSkillNameCounts = counter(
  allHelpfulSkills.map((s) => s.name.trim().toLowerCase()),
);
printTable(
  `Helpful Skills Requested (top 30) — ${allHelpfulSkills.length} total`,
  topN(helpfulSkillNameCounts, 30),
);

// Print some reasons
console.log(`\n  Sample helpful skill reasons:`);
for (const s of allHelpfulSkills.slice(0, 15)) {
  console.log(`  - [${s.name}]: ${s.reason.slice(0, 150)}`);
}

// 9. Helpful Resources
const allResources: string[] = [];
for (const m of metas) {
  if (Array.isArray(m.helpfulResources)) allResources.push(...m.helpfulResources);
}
console.log(`\n${"=".repeat(70)}`);
console.log(`  Helpful Resources: ${allResources.length} URLs from ${metas.filter((m) => m.helpfulResources && m.helpfulResources.length > 0).length} projects`);
console.log(`${"=".repeat(70)}`);

// Group by domain
const domainCounts = counter(
  allResources.map((url) => {
    try {
      return new URL(url).hostname.replace("www.", "");
    } catch {
      return "invalid-url";
    }
  }),
);
printTable("Resource Domains (top 20)", topN(domainCounts, 20));

// 10. Repo stats
const withCommits = metas.filter(
  (m) => m.commitCount !== null && m.commitCount !== undefined,
);
const commitCounts = withCommits.map((m) => m.commitCount!);
const contributorCounts = withCommits
  .filter((m) => m.contributorCount !== null && m.contributorCount !== undefined)
  .map((m) => m.contributorCount!);

if (commitCounts.length > 0) {
  console.log(`\n${"=".repeat(70)}`);
  console.log(`  Repo Stats (${withCommits.length} projects with data)`);
  console.log(`${"=".repeat(70)}`);
  const sorted = [...commitCounts].sort((a, b) => a - b);
  console.log(`  Commits: min=${sorted[0]}, median=${sorted[Math.floor(sorted.length / 2)]}, mean=${(sorted.reduce((a, b) => a + b, 0) / sorted.length).toFixed(1)}, max=${sorted[sorted.length - 1]}`);

  if (contributorCounts.length > 0) {
    const csorted = [...contributorCounts].sort((a, b) => a - b);
    console.log(`  Contributors: min=${csorted[0]}, median=${csorted[Math.floor(csorted.length / 2)]}, mean=${(csorted.reduce((a, b) => a + b, 0) / csorted.length).toFixed(1)}, max=${csorted[csorted.length - 1]}`);
  }
}

// 11. Moltbook adoption
const moltbookCount = metas.filter(
  (m) => m.moltbookPostURL && m.moltbookPostURL.trim().length > 0,
).length;
console.log(`\n  Moltbook posts provided: ${moltbookCount} / ${metas.length} (${((moltbookCount / metas.length) * 100).toFixed(1)}%)`);

// 12. Published vs Draft comparison for key metrics
console.log(`\n${"=".repeat(70)}`);
console.log(`  Published vs Draft Comparison`);
console.log(`${"=".repeat(70)}`);

const pubMetas = publishedMetas.map((m) => m.meta);
const draftMetas = allMetas.filter((m) => m.status === "draft").map((m) => m.meta);

const pubFrameworks = counter(pubMetas.map((m) => m.agentFramework));
const draftFrameworks = counter(draftMetas.map((m) => m.agentFramework));
console.log(`\n  Frameworks (published ${pubMetas.length} / draft ${draftMetas.length}):`);
const allFrameworkKeys = new Set([...pubFrameworks.keys(), ...draftFrameworks.keys()]);
for (const key of [...allFrameworkKeys].sort(
  (a, b) => (pubFrameworks.get(b) ?? 0) - (pubFrameworks.get(a) ?? 0),
)) {
  const pub = pubFrameworks.get(key) ?? 0;
  const draft = draftFrameworks.get(key) ?? 0;
  console.log(
    `    ${key.padEnd(25)} pub: ${String(pub).padStart(4)} (${((pub / pubMetas.length) * 100).toFixed(1)}%)   draft: ${String(draft).padStart(4)} (${((draft / draftMetas.length) * 100).toFixed(1)}%)`,
  );
}

const pubHarnesses = counter(pubMetas.map((m) => m.agentHarness));
const draftHarnesses = counter(draftMetas.map((m) => m.agentHarness));
console.log(`\n  Harnesses (published / draft):`);
const allHarnessKeys = new Set([...pubHarnesses.keys(), ...draftHarnesses.keys()]);
for (const key of [...allHarnessKeys].sort(
  (a, b) => (pubHarnesses.get(b) ?? 0) - (pubHarnesses.get(a) ?? 0),
)) {
  const pub = pubHarnesses.get(key) ?? 0;
  const draft = draftHarnesses.get(key) ?? 0;
  console.log(
    `    ${key.padEnd(25)} pub: ${String(pub).padStart(4)} (${((pub / pubMetas.length) * 100).toFixed(1)}%)   draft: ${String(draft).padStart(4)} (${((draft / draftMetas.length) * 100).toFixed(1)}%)`,
  );
}

console.log(`\nDone.`);
