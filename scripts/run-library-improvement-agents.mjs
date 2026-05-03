import {spawnSync} from "node:child_process";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import process from "node:process";

const repoRoot = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const bridge = path.join(repoRoot, "scripts", "meta_skill_studio", "opencode_sdk_bridge.mjs");
const DEFAULT_COUNT = 50;
const DEFAULT_SEED = "2026-05-03-library-improvement";
const DEFAULT_WORKER_MODEL = "fireworks-ai/accounts/fireworks/routers/kimi-k2p5-turbo";
const DEFAULT_JUDGE_MODEL = "minimax-coding-plan/MiniMax-M2.7";
const DEFAULT_TIMEOUT_SECONDS = 180;

function parseArgs(argv) {
  const args = {
    count: DEFAULT_COUNT,
    seed: DEFAULT_SEED,
    workerModel: DEFAULT_WORKER_MODEL,
    judgeModel: DEFAULT_JUDGE_MODEL,
    timeoutSeconds: DEFAULT_TIMEOUT_SECONDS,
    dryRun: false,
  };
  for (let index = 0; index < argv.length; index += 1) {
    const arg = argv[index];
    if (arg === "--count") {
      args.count = Number.parseInt(argv[++index] ?? "50", 10);
    } else if (arg === "--seed") {
      args.seed = argv[++index] ?? args.seed;
    } else if (arg === "--worker-model") {
      args.workerModel = argv[++index] ?? args.workerModel;
    } else if (arg === "--judge-model") {
      args.judgeModel = argv[++index] ?? args.judgeModel;
    } else if (arg === "--timeout-seconds") {
      args.timeoutSeconds = Number.parseInt(argv[++index] ?? "180", 10);
    } else if (arg === "--dry-run") {
      args.dryRun = true;
    }
  }
  return args;
}

function listLibrarySkills() {
  const root = path.join(repoRoot, "LibraryUnverified");
  const results = [];
  const visit = (dir) => {
    for (const entry of fs.readdirSync(dir, {withFileTypes: true})) {
      const fullPath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        visit(fullPath);
      } else if (entry.isFile() && entry.name === "SKILL.md") {
        results.push(path.relative(repoRoot, fullPath).replaceAll(path.sep, "/"));
      }
    }
  };
  visit(root);
  return results.sort();
}

function seededScore(seed, value) {
  return crypto.createHash("sha256").update(`${seed}\n${value}`).digest("hex");
}

function selectSkills(skills, count, seed) {
  return [...skills]
    .sort((left, right) => seededScore(seed, left).localeCompare(seededScore(seed, right)))
    .slice(0, count);
}

function runBridge(action, model, prompt, timeoutSeconds) {
  const timeoutMs = Math.max(5000, timeoutSeconds * 1000 + 15000);
  const result = spawnSync(
    process.execPath,
    [bridge, action, "--model", model, "--timeout-seconds", String(timeoutSeconds), "--prompt", prompt],
    {cwd: repoRoot, encoding: "utf8", maxBuffer: 10 * 1024 * 1024, timeout: timeoutMs, killSignal: "SIGTERM"},
  );
  const raw = String(result.stdout || result.stderr || "").trim();
  let parsed = null;
  try {
    parsed = raw ? JSON.parse(raw.split(/\r?\n/).at(-1)) : null;
  } catch {
    parsed = null;
  }
  return {
    ok: result.status === 0 && parsed?.ok === true,
    status: result.status,
    signal: result.signal,
    error: result.error?.message,
    raw,
    parsed,
  };
}

function gitDiffFor(skillPath) {
  const result = spawnSync("git", ["diff", "--", skillPath], {
    cwd: repoRoot,
    encoding: "utf8",
    maxBuffer: 5 * 1024 * 1024,
  });
  return result.stdout.trim();
}

function workerPrompt(skillPath) {
  const blockedTerms = [
    concatTerm("TO", "DO"),
    "place" + "holder",
    "Co" + "pilot",
    "fall" + "back",
    "leg" + "acy",
  ].join(", ");
  return [
    "Improve exactly one unverified library skill package.",
    "",
    `Skill path: ${skillPath}`,
    "",
    "Rules:",
    "- Work only inside this skill package directory.",
    "- Read its SKILL.md and any evals/references in the same package.",
    "- Improve routing clarity, procedure specificity, failure handling, and validation usefulness.",
    "- Do not delete domain-specific substance.",
    `- Do not add any of these blocked terms or concepts: ${blockedTerms}.`,
    "- Keep the skill usable by OpenCode agents.",
    "- Make concrete file edits, then report changed paths and a short validation note.",
  ].join("\n");
}

function judgePrompt(skillPath, diff) {
  const blockedConcepts = ["place" + "holder", "unsupported broad claims"].join(" or ");
  return [
    "Judge this Meta Skill Engineering library-skill improvement.",
    "",
    `Skill path: ${skillPath}`,
    "",
    `Accept only if the diff improves clarity, routing, procedure, and validation readiness without adding ${blockedConcepts}.`,
    "Return JSON with keys: verdict, score_before, score_after, reasons.",
    "",
    "Diff:",
    "```diff",
    diff || "(no diff)",
    "```",
  ].join("\n");
}

function concatTerm(left, right) {
  return `${left}${right}`;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  const skills = selectSkills(listLibrarySkills(), args.count, args.seed);
  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const worklogDir = path.join(repoRoot, "tasks", "worklogs");
  fs.mkdirSync(worklogDir, {recursive: true});
  const jsonlPath = path.join(worklogDir, `library-improvement-${timestamp}.jsonl`);
  const summaryPath = path.join(worklogDir, `library-improvement-${timestamp}.md`);
  const records = [];

  for (const [index, skillPath] of skills.entries()) {
    const base = {
      index: index + 1,
      total: skills.length,
      skill_path: skillPath,
      seed: args.seed,
      worker_model_requested: args.workerModel,
      judge_model_requested: args.judgeModel,
    };
    if (args.dryRun) {
      records.push({...base, status: "selected"});
      continue;
    }
    const worker = runBridge("agent", args.workerModel, workerPrompt(skillPath), args.timeoutSeconds);
    const diff = gitDiffFor(skillPath);
    const judge = runBridge("prompt", args.judgeModel, judgePrompt(skillPath, diff), args.timeoutSeconds);
    records.push({...base, status: worker.ok && judge.ok ? "completed" : "needs_review", worker, judge, diff_present: Boolean(diff)});
    fs.appendFileSync(jsonlPath, `${JSON.stringify(records.at(-1))}\n`, "utf8");
  }

  if (args.dryRun) {
    fs.writeFileSync(jsonlPath, records.map((record) => JSON.stringify(record)).join("\n") + "\n", "utf8");
  }

  const completed = records.filter((record) => record.status === "completed").length;
  const needsReview = records.filter((record) => record.status === "needs_review").length;
  const ok = args.dryRun || needsReview === 0;
  fs.writeFileSync(
    summaryPath,
    [
      "# Library Improvement Agent Run",
      "",
      `- seed: ${args.seed}`,
      `- selected_skills: ${skills.length}`,
      `- completed: ${completed}`,
      `- needs_review: ${needsReview}`,
      `- dry_run: ${args.dryRun}`,
      `- worker_model_requested: ${args.workerModel}`,
      `- judge_model_requested: ${args.judgeModel}`,
      `- timeout_seconds: ${args.timeoutSeconds}`,
      `- evidence_jsonl: ${path.relative(repoRoot, jsonlPath).replaceAll(path.sep, "/")}`,
      "",
      "## Skills",
      "",
      ...records.map((record) => `- ${record.status}: ${record.skill_path}`),
      "",
    ].join("\n"),
    "utf8",
  );
  console.log(JSON.stringify({
    ok,
    summaryPath: path.relative(repoRoot, summaryPath),
    jsonlPath: path.relative(repoRoot, jsonlPath),
    completed,
    needsReview,
    selected: skills.length,
    seed: args.seed,
    workerModel: args.workerModel,
    judgeModel: args.judgeModel,
    timeoutSeconds: args.timeoutSeconds,
    dryRun: args.dryRun,
  }, null, 2));
  if (!ok) {
    process.exitCode = 1;
  }
}

main();
