import { Field } from "@/components/ui";
import { inputTypeFor, type RequirementKind } from "@/lib/work";

const SELECT = "h-9 rounded-md border border-border bg-background px-2 text-sm";

/** An input that suits the kind of value a requirement asks for. */
export function ValueInput({
  kind,
  label,
  value,
  onChange,
}: {
  kind: RequirementKind;
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  if (kind === "BOOLEAN") {
    return (
      <div className="flex flex-col gap-1.5">
        <label className="text-sm font-medium">
          {label}
          <select required value={value} onChange={(event) => onChange(event.target.value)} className={`${SELECT} mt-1.5 w-full`}>
            <option value="">Choose…</option>
            <option value="true">Yes</option>
            <option value="false">No</option>
          </select>
        </label>
      </div>
    );
  }
  return (
    <Field
      label={label}
      required
      type={inputTypeFor(kind)}
      inputMode={kind === "NUMBER" ? "decimal" : undefined}
      maxLength={4000}
      value={value}
      onChange={(event) => onChange(event.target.value)}
    />
  );
}
