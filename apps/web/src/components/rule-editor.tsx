"use client";

import type { components } from "@avenra/contracts";
import { Button, Field } from "@/components/ui";

type RuleInput = components["schemas"]["VerificationRuleInput"];
type RuleType = components["schemas"]["RuleType"];
type RequirementKind = components["schemas"]["RequirementKind"];
/** A change to a rule; a field set to undefined is removed. */
type RulePatch = { [K in keyof RuleInput]?: RuleInput[K] | undefined };

function applyPatch(rule: RuleInput, patch: RulePatch): RuleInput {
  const merged: Record<string, unknown> = { ...rule, ...patch };
  for (const key of Object.keys(merged)) {
    if (merged[key] === undefined) delete merged[key];
  }
  return merged as RuleInput;
}

const SELECT = "h-9 rounded-md border border-border bg-background px-2 text-sm";

/** Which checks fit which kind of answer (mirrors the server's rule validation, ADR-027). */
export const RULES_FOR_KIND: Record<RequirementKind, RuleType[]> = {
  TEXT: ["PATTERN", "LENGTH", "ONE_OF", "EQUALS_REQUIREMENT"],
  NUMBER: ["RANGE", "ONE_OF", "EQUALS_REQUIREMENT"],
  DATE: ["DATE_RANGE", "DATE_ORDER", "EQUALS_REQUIREMENT"],
  BOOLEAN: [],
  DOCUMENT: ["FILE_TYPE", "FILE_SIZE", "DOCUMENT_KIND", "DOCUMENT_FIELD"],
};

/** Checks based on reading the document automatically: advisory only (ADR-031). */
export function readsDocument(type: RuleType): boolean {
  return type === "DOCUMENT_KIND" || type === "DOCUMENT_FIELD";
}

export const RULE_LABELS: Record<RuleType, string> = {
  PATTERN: "Matches a pattern",
  LENGTH: "Length",
  ONE_OF: "One of a list",
  RANGE: "Number range",
  DATE_RANGE: "Date range",
  EQUALS_REQUIREMENT: "Same as another answer",
  DATE_ORDER: "Before or after another date",
  FILE_TYPE: "File type",
  FILE_SIZE: "File size",
  DOCUMENT_KIND: "Kind of document (read automatically)",
  DOCUMENT_FIELD: "A field in the document (read automatically)",
};

const FILE_TYPES: { value: string; label: string }[] = [
  { value: "application/pdf", label: "PDF" },
  { value: "image/png", label: "PNG" },
  { value: "image/jpeg", label: "JPEG" },
  { value: "application/vnd.openxmlformats-officedocument.wordprocessingml.document", label: "Word" },
  { value: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", label: "Excel" },
  { value: "text/csv", label: "CSV" },
];

export function newRule(type: RuleType): RuleInput {
  if (type === "DOCUMENT_FIELD") return { type, severity: "ADVISORY", message: "", fieldKind: "TEXT" };
  return { type, severity: readsDocument(type) ? "ADVISORY" : "BLOCKING", message: "" };
}

/** Keeps only the fields of the rule's own type, as the server requires. */
export function cleanRule(rule: RuleInput): RuleInput {
  const severity = readsDocument(rule.type) ? "ADVISORY" : rule.severity;
  const base: RuleInput = { type: rule.type, severity, message: rule.message.trim() };
  const keep: Record<RuleType, (keyof RuleInput)[]> = {
    PATTERN: ["pattern"],
    LENGTH: ["minLength", "maxLength"],
    ONE_OF: ["values"],
    RANGE: ["min", "max"],
    DATE_RANGE: ["notBefore", "notAfter", "minDaysFromToday", "maxDaysFromToday"],
    EQUALS_REQUIREMENT: ["otherRequirementId"],
    DATE_ORDER: ["otherRequirementId", "order"],
    FILE_TYPE: ["contentTypes"],
    FILE_SIZE: ["maxBytes"],
    DOCUMENT_KIND: ["values"],
    DOCUMENT_FIELD: ["field", "fieldKind", "otherRequirementId", "minDaysFromToday"],
  };
  const out: Record<string, unknown> = { ...base };
  for (const key of keep[rule.type]) {
    const value = rule[key];
    if (value !== undefined && value !== "" && !(Array.isArray(value) && value.length === 0)) {
      out[key] = value;
    }
  }
  return out as RuleInput;
}

function numberOrUndefined(value: string): number | undefined {
  return value.trim() === "" ? undefined : Number(value);
}

export function RuleEditor({
  kind,
  rules,
  onChange,
  others,
  readingEnabled,
}: {
  kind: RequirementKind;
  rules: RuleInput[];
  onChange: (rules: RuleInput[]) => void;
  others: { id: string; title: string; kind: RequirementKind }[];
  /** Whether the organization lets documents be read automatically; unknown when undefined. */
  readingEnabled?: boolean | undefined;
}) {
  const available = RULES_FOR_KIND[kind];
  const update = (index: number, patch: RulePatch) => onChange(rules.map((rule, i) => (i === index ? applyPatch(rule, patch) : rule)));
  const remove = (index: number) => onChange(rules.filter((_, i) => i !== index));
  const sameKind = others.filter((other) => other.kind === kind);

  if (available.length === 0) {
    return <p className="text-sm text-text-secondary">Yes/no answers have no checks.</p>;
  }

  return (
    <div className="flex flex-col gap-3" data-testid="rule-editor">
      {rules.map((rule, index) => (
        <fieldset key={index} className="flex flex-col gap-2 rounded-md border border-border p-3 text-sm">
          <legend className="px-1 text-text-secondary">Check {index + 1}</legend>
          <div className="flex flex-wrap items-end gap-3">
            <label className="flex flex-col gap-1">
              Check
              <select
                className={SELECT}
                value={rule.type}
                onChange={(event) => {
                  const type = event.target.value as RuleType;
                  onChange(rules.map((r, i) => (i === index ? { ...newRule(type), message: r.message, severity: readsDocument(type) ? "ADVISORY" : r.severity } : r)));
                }}
              >
                {available.map((type) => (
                  <option key={type} value={type}>
                    {RULE_LABELS[type]}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex flex-col gap-1">
              If it fails
              {readsDocument(rule.type) ? (
                <select className={SELECT} value="ADVISORY" disabled aria-describedby={`ai-note-${index}`}>
                  <option value="ADVISORY">Flag for review</option>
                </select>
              ) : (
                <select className={SELECT} value={rule.severity} onChange={(event) => update(index, { severity: event.target.value as RuleInput["severity"] })}>
                  <option value="BLOCKING">Reject the answer</option>
                  <option value="ADVISORY">Flag for review</option>
                </select>
              )}
            </label>
            <Button type="button" variant="secondary" onClick={() => remove(index)}>
              Remove
            </Button>
          </div>
          {readsDocument(rule.type) ? (
            <p id={`ai-note-${index}`} className="text-text-secondary" data-testid="ai-rule-note">
              The document is read automatically. This check only flags the answer for a person; it never rejects or accepts it.
              {readingEnabled === false ? " Automatic reading is switched off for this organization, so the check waits until an owner switches it on." : ""}
            </p>
          ) : null}
          <RuleParameters rule={rule} index={index} update={update} others={readsDocument(rule.type) ? others : sameKind} />
          <Field
            label="Message when it fails (the client sees it for rejected answers)"
            required
            maxLength={300}
            value={rule.message}
            onChange={(event) => update(index, { message: event.target.value })}
          />
        </fieldset>
      ))}
      <div>
        <Button type="button" variant="secondary" onClick={() => onChange([...rules, newRule(available[0] as RuleType)])}>
          Add a check
        </Button>
      </div>
    </div>
  );
}

function RuleParameters({
  rule,
  index,
  update,
  others,
}: {
  rule: RuleInput;
  index: number;
  update: (index: number, patch: RulePatch) => void;
  others: { id: string; title: string; kind?: RequirementKind }[];
}) {
  switch (rule.type) {
    case "PATTERN":
      return <Field label="Pattern (regular expression for the whole answer)" required maxLength={200} value={rule.pattern ?? ""} onChange={(e) => update(index, { pattern: e.target.value })} />;
    case "LENGTH":
      return (
        <div className="flex gap-3">
          <Field label="At least (characters)" type="number" min={0} value={rule.minLength ?? ""} onChange={(e) => update(index, { minLength: numberOrUndefined(e.target.value) })} />
          <Field label="At most (characters)" type="number" min={1} value={rule.maxLength ?? ""} onChange={(e) => update(index, { maxLength: numberOrUndefined(e.target.value) })} />
        </div>
      );
    case "ONE_OF":
      return (
        <Field
          label="Allowed values (comma-separated)"
          required
          value={(rule.values ?? []).join(", ")}
          onChange={(e) => update(index, { values: e.target.value.split(",").map((value) => value.trim()).filter(Boolean) })}
        />
      );
    case "RANGE":
      return (
        <div className="flex gap-3">
          <Field label="Minimum" inputMode="decimal" value={rule.min ?? ""} onChange={(e) => update(index, { min: e.target.value.trim() || undefined })} />
          <Field label="Maximum" inputMode="decimal" value={rule.max ?? ""} onChange={(e) => update(index, { max: e.target.value.trim() || undefined })} />
        </div>
      );
    case "DATE_RANGE":
      return (
        <div className="flex flex-wrap gap-3">
          <Field label="Not before" type="date" value={rule.notBefore ?? ""} onChange={(e) => update(index, { notBefore: e.target.value || undefined })} />
          <Field label="Not after" type="date" value={rule.notAfter ?? ""} onChange={(e) => update(index, { notAfter: e.target.value || undefined })} />
          <Field
            label="At least this many days from today"
            type="number"
            value={rule.minDaysFromToday ?? ""}
            onChange={(e) => update(index, { minDaysFromToday: numberOrUndefined(e.target.value) })}
          />
        </div>
      );
    case "EQUALS_REQUIREMENT":
    case "DATE_ORDER":
      return (
        <div className="flex flex-wrap items-end gap-3">
          {rule.type === "DATE_ORDER" ? (
            <label className="flex flex-col gap-1">
              This date is
              <select className={SELECT} value={rule.order ?? "BEFORE"} onChange={(e) => update(index, { order: e.target.value as "BEFORE" | "AFTER" })}>
                <option value="BEFORE">before</option>
                <option value="AFTER">after</option>
              </select>
            </label>
          ) : null}
          <label className="flex flex-col gap-1">
            {rule.type === "DATE_ORDER" ? "the answer to" : "Same as the answer to"}
            <select className={SELECT} required value={rule.otherRequirementId ?? ""} onChange={(e) => update(index, { otherRequirementId: e.target.value || undefined })}>
              <option value="">Choose…</option>
              {others.map((other) => (
                <option key={other.id} value={other.id}>
                  {other.title}
                </option>
              ))}
            </select>
          </label>
        </div>
      );
    case "FILE_TYPE":
      return (
        <div className="flex flex-wrap gap-3">
          {FILE_TYPES.map((type) => (
            <label key={type.value} className="flex items-center gap-1">
              <input
                type="checkbox"
                checked={(rule.contentTypes ?? []).includes(type.value)}
                onChange={(e) =>
                  update(index, {
                    contentTypes: e.target.checked
                      ? [...(rule.contentTypes ?? []), type.value]
                      : (rule.contentTypes ?? []).filter((value) => value !== type.value),
                  })
                }
              />
              {type.label}
            </label>
          ))}
        </div>
      );
    case "FILE_SIZE":
      return (
        <Field
          label="Largest file (MB)"
          type="number"
          min={1}
          max={25}
          value={rule.maxBytes ? String(rule.maxBytes / (1024 * 1024)) : ""}
          onChange={(e) => update(index, { maxBytes: e.target.value ? Math.round(Number(e.target.value) * 1024 * 1024) : undefined })}
        />
      );
    case "DOCUMENT_KIND":
      return (
        <Field
          label="Acceptable kinds of document (comma-separated, e.g. passport, national identity card)"
          required
          value={(rule.values ?? []).join(", ")}
          onChange={(e) => update(index, { values: e.target.value.split(",").map((value) => value.trim()).filter(Boolean) })}
        />
      );
    case "DOCUMENT_FIELD": {
      const fieldKind = rule.fieldKind ?? "TEXT";
      const comparable = others.filter((other) => other.kind === fieldKind);
      return (
        <div className="flex flex-wrap items-end gap-3">
          <Field
            label="Field, as labelled in the document"
            required
            maxLength={60}
            pattern="[A-Za-z][A-Za-z0-9 _\\-]*"
            value={rule.field ?? ""}
            onChange={(e) => update(index, { field: e.target.value || undefined })}
          />
          <label className="flex flex-col gap-1">
            Kind of value
            <select
              className={SELECT}
              value={fieldKind}
              onChange={(e) =>
                update(index, {
                  fieldKind: e.target.value as "TEXT" | "NUMBER" | "DATE",
                  otherRequirementId: undefined,
                  minDaysFromToday: e.target.value === "DATE" ? rule.minDaysFromToday : undefined,
                })
              }
            >
              <option value="TEXT">Text</option>
              <option value="NUMBER">Number</option>
              <option value="DATE">Date</option>
            </select>
          </label>
          <label className="flex flex-col gap-1">
            Must match the answer to (optional)
            <select className={SELECT} value={rule.otherRequirementId ?? ""} onChange={(e) => update(index, { otherRequirementId: e.target.value || undefined })}>
              <option value="">Nothing; just be present</option>
              {comparable.map((other) => (
                <option key={other.id} value={other.id}>
                  {other.title}
                </option>
              ))}
            </select>
          </label>
          {fieldKind === "DATE" ? (
            <Field
              label="At least this many days from today"
              type="number"
              value={rule.minDaysFromToday ?? ""}
              onChange={(e) => update(index, { minDaysFromToday: numberOrUndefined(e.target.value) })}
            />
          ) : null}
        </div>
      );
    }
  }
}
