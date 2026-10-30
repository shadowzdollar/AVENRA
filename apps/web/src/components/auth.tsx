"use client";

import { Check, Eye, EyeOff, History, Lock, Mail, ShieldCheck, Smartphone } from "lucide-react";
import { useId, useRef, useState, type ClipboardEvent, type InputHTMLAttributes, type KeyboardEvent } from "react";
import { INPUT_CLASS } from "@/components/ui";
import { emailSuggestion, passwordChecks, strength } from "@/lib/password";

/*
 * The sign-in, sign-up and password pages' own fields (ADR-039): everything
 * here guides; the API enforces every rule.
 */

type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, "type" | "onChange" | "value"> & {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
};

/** A password with show/hide and a Caps Lock warning. */
export function PasswordField({ label, value, onChange, error, ...rest }: InputProps) {
  const id = useId();
  const [visible, setVisible] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const described = [error ? `${id}-error` : null, capsLock ? `${id}-caps` : null].filter(Boolean).join(" ") || undefined;
  const checkCaps = (event: KeyboardEvent<HTMLInputElement>) => setCapsLock(event.getModifierState("CapsLock"));
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium">
        {label}
      </label>
      <div className="relative">
        <Lock className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary" />
        <input
          id={id}
          {...rest}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(event) => onChange(event.target.value)}
          onKeyUp={checkCaps}
          onKeyDown={checkCaps}
          onBlur={() => setCapsLock(false)}
          aria-invalid={error ? true : undefined}
          aria-describedby={described}
          className={`${INPUT_CLASS} h-10 pl-9 pr-10`}
        />
        <button
          type="button"
          onClick={() => setVisible(!visible)}
          aria-label={visible ? "Hide the characters" : "Show the characters"}
          aria-pressed={visible}
          className="absolute right-2 top-1/2 flex size-7 -translate-y-1/2 items-center justify-center rounded-md text-text-secondary hover:text-text-primary"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>
      {capsLock ? (
        <p id={`${id}-caps`} className="text-[12px] text-warning" role="status">
          Caps Lock is on.
        </p>
      ) : null}
      {error ? (
        <p id={`${id}-error`} className="text-[12px] text-error">
          {error}
        </p>
      ) : null}
    </div>
  );
}

const METER = ["", "bg-error", "bg-warning", "bg-brand", "bg-success"];

/** How the chosen password measures up to the rules, as it is typed. */
export function PasswordGuidance({ password, email }: { password: string; email: string }) {
  const rated = strength(password);
  const checks = passwordChecks(password, email);
  return (
    <div className="flex flex-col gap-2" data-testid="password-guidance">
      <div className="flex items-center gap-3">
        <div className="grid flex-1 grid-cols-4 gap-1" aria-hidden>
          {[1, 2, 3, 4].map((bar) => (
            <span key={bar} className={`h-1 rounded-full ${rated.score >= bar ? METER[rated.score] : "bg-border"}`} />
          ))}
        </div>
        <span className="w-20 text-right text-[11px] font-medium text-text-secondary" aria-live="polite">
          {rated.label}
        </span>
      </div>
      <ul className="grid gap-1 text-[12px] sm:grid-cols-2">
        {checks.map((check) => (
          <li key={check.label} className={`flex items-center gap-1.5 ${check.met ? "text-success" : "text-text-secondary"}`}>
            <Check className={`size-3.5 ${check.met ? "" : "opacity-30"}`} aria-hidden />
            {check.label}
            <span className="sr-only">{check.met ? " (done)" : " (not yet)"}</span>
          </li>
        ))}
        <li className="flex items-center gap-1.5 text-text-secondary">
          <ShieldCheck className="size-3.5 opacity-60" aria-hidden />
          Not a commonly used password
        </li>
      </ul>
    </div>
  );
}

/** A work email, with a suggestion when the domain looks mistyped. */
export function EmailField({ label, value, onChange, error, ...rest }: InputProps) {
  const id = useId();
  const suggestion = emailSuggestion(value);
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="text-[13px] font-medium">
        {label}
      </label>
      <div className="relative">
        <Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-text-secondary" />
        <input
          id={id}
          {...rest}
          type="email"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          aria-invalid={error ? true : undefined}
          className={`${INPUT_CLASS} h-10 pl-9`}
        />
      </div>
      {suggestion ? (
        <p className="text-[12px] text-text-secondary">
          Did you mean{" "}
          <button type="button" className="font-medium text-brand hover:underline" onClick={() => onChange(suggestion)}>
            {suggestion}
          </button>
          ?
        </p>
      ) : null}
      {error ? <p className="text-[12px] text-error">{error}</p> : null}
    </div>
  );
}

const DIGITS = 6;

/**
 * A two-step verification code: six boxes that move on as you type and take a
 * pasted code whole; or one field for a recovery code.
 */
export function CodeInput({ value, onChange, recovery, onRecoveryChange }: { value: string; onChange: (value: string) => void; recovery: boolean; onRecoveryChange: (recovery: boolean) => void }) {
  const boxes = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(DIGITS, " ").slice(0, DIGITS).split("");

  function set(index: number, digit: string) {
    const next = digits.map((current, position) => (position === index ? digit || " " : current)).join("").trimEnd();
    onChange(next);
  }

  function paste(event: ClipboardEvent<HTMLInputElement>) {
    const pasted = event.clipboardData.getData("text").replace(/\D/g, "").slice(0, DIGITS);
    if (pasted) {
      event.preventDefault();
      onChange(pasted);
      boxes.current[Math.min(pasted.length, DIGITS - 1)]?.focus();
    }
  }

  if (recovery) {
    return (
      <div className="flex flex-col gap-1.5">
        <label htmlFor="recovery-code" className="text-[13px] font-medium">
          Recovery code
        </label>
        <input
          id="recovery-code"
          autoComplete="one-time-code"
          value={value}
          onChange={(event) => onChange(event.target.value)}
          className={`${INPUT_CLASS} h-10 font-mono tracking-wider`}
          placeholder="XXXX-XXXX"
        />
        <button type="button" className="self-start text-[12px] font-medium text-brand hover:underline" onClick={() => { onChange(""); onRecoveryChange(false); }}>
          Use the code from my authenticator app
        </button>
      </div>
    );
  }

  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="mb-1.5 flex items-center gap-1.5 text-[13px] font-medium">
        <Smartphone className="size-4 text-text-secondary" aria-hidden />
        Code from your authenticator app
      </legend>
      <div className="flex justify-between gap-2">
        {digits.map((digit, index) => (
          <input
            key={index}
            ref={(element) => {
              boxes.current[index] = element;
            }}
            aria-label={`Digit ${index + 1}`}
            inputMode="numeric"
            autoComplete={index === 0 ? "one-time-code" : "off"}
            maxLength={1}
            value={digit.trim()}
            onPaste={paste}
            onChange={(event) => {
              const typed = event.target.value.replace(/\D/g, "").slice(-1);
              set(index, typed);
              if (typed) boxes.current[index + 1]?.focus();
            }}
            onKeyDown={(event) => {
              if (event.key === "Backspace" && !digit.trim()) boxes.current[index - 1]?.focus();
            }}
            className="h-12 w-11 rounded-lg border border-border bg-background text-center text-lg font-semibold tabular-nums outline-none focus:border-brand focus:ring-2 focus:ring-brand-surface"
          />
        ))}
      </div>
      <button type="button" className="self-start text-[12px] font-medium text-brand hover:underline" onClick={() => { onChange(""); onRecoveryChange(true); }}>
        Use a recovery code instead
      </button>
    </fieldset>
  );
}

/** What protects the account, in a line under the form: features that exist. */
export function TrustRow() {
  const items = [
    { icon: Smartphone, label: "Two-step verification" },
    { icon: History, label: "Sessions you can see and end" },
    { icon: ShieldCheck, label: "Every action audited" },
  ];
  return (
    <ul className="mt-8 flex flex-wrap items-center justify-center gap-x-4 gap-y-2 border-t border-border pt-5 text-[11px] text-text-secondary">
      {items.map(({ icon: Icon, label }) => (
        <li key={label} className="flex items-center gap-1.5">
          <Icon className="size-3.5" aria-hidden />
          {label}
        </li>
      ))}
    </ul>
  );
}
