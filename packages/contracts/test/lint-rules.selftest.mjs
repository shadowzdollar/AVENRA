// Proves the contract lint rules detect violations: lints a deliberately
// broken fixture and requires every Avenra rule to report it. Without this,
// a misconfigured rule could pass silently forever.
import { spawnSync } from "node:child_process";

const expectedRules = [
  "rule/operation-declares-permission",
  "rule/operation-declares-audit",
  "rule/operation-declares-idempotency",
  "rule/operation-declares-rate-limit",
  "rule/paths-are-versioned",
];

const result = spawnSync(
  "redocly",
  ["lint", "test/fixtures/violations.v1.yaml", "--config", "redocly.yaml", "--format", "json"],
  { encoding: "utf8", shell: false },
);

if (result.status === 0) {
  console.error("FAIL: linting the broken fixture succeeded; the rules are not enforced.");
  process.exit(1);
}

const report = JSON.parse(result.stdout);
const reported = new Set(report.problems.map((problem) => problem.ruleId));
const missing = expectedRules.filter((rule) => !reported.has(rule));

if (missing.length > 0) {
  console.error(`FAIL: these rules did not report the fixture: ${missing.join(", ")}`);
  process.exit(1);
}

console.log(`OK: all ${expectedRules.length} Avenra lint rules detect violations.`);
