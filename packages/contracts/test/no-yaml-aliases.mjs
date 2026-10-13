// The Java generator's YAML parser rejects documents with more than 50
// aliases (a guard against "billion laughs" attacks), and aliases make the
// contract harder to read. The contract must be written out in full.
import { readFileSync } from "node:fs";

const file = "openapi/avenra.v1.yaml";
const lines = readFileSync(file, "utf8").split("\n");
const offending = lines
  .map((line, index) => ({ line, number: index + 1 }))
  .filter(({ line }) => /(^|[\s:\[,-])[&*][A-Za-z0-9_-]+(\s|$)/.test(line) && !/^\s*#/.test(line) && !/["'`].*[&*].*["'`]/.test(line));

if (offending.length > 0) {
  for (const { line, number } of offending) console.error(`${file}:${number}: YAML anchor or alias: ${line.trim()}`);
  process.exit(1);
}
console.log("OK: no YAML anchors or aliases in the contract.");
