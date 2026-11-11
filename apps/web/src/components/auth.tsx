"use client";

import { Check, Eye, EyeOff, History, Loader2, Lock, Mail, ShieldCheck, Smartphone } from "lucide-react";
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
          className={`${INPUT_CLASS} h-11 rounded-xl pl-9 pr-10`}
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
          className={`${INPUT_CLASS} h-11 rounded-xl pl-9`}
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

function GoogleIcon({ className = "size-[18px] shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        fill="#4285F4"
        d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17Z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.1-6.72-4.93H1.25v3.15C3.26 21.36 7.33 24 12 24Z"
      />
      <path
        fill="#FBBC05"
        d="M5.28 14.27c-.25-.72-.38-1.49-.38-2.27s.13-1.55.38-2.27V6.58H1.25C.45 8.18 0 9.99 0 12s.45 3.82 1.25 5.42l4.03-3.15Z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.33 0 3.26 2.64 1.25 6.58l4.03 3.15c.95-2.83 3.6-4.98 6.72-4.98Z"
      />
    </svg>
  );
}

function AppleIcon({ className = "size-[18px] shrink-0" }: { className?: string }) {
  return (
    <svg viewBox="0 0 170 170" fill="currentColor" className={className} aria-hidden="true">
      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.05-7.6-7.85-11.72-14.39-6.02-9.58-10.68-20.24-13.99-31.98-3.31-11.74-4.97-22.75-4.97-33.03 0-14.42 3.61-26.41 10.84-35.96 7.23-9.55 16.29-14.43 27.18-14.65 4.8 0 10.14 1.28 16.02 3.84 5.88 2.56 9.61 3.9 11.2 4.02 2.01-.25 5.8-1.63 11.36-4.14 5.57-2.51 10.66-3.71 15.29-3.61 11.64.44 21.05 4.54 28.23 12.3-10.12 6.13-15.08 14.69-14.88 25.68.21 8.52 3.4 15.77 9.58 21.75 6.17 5.98 13.52 9.38 22.04 10.2-2.17 6.44-4.78 12.98-7.83 19.63l-.78 1.69zm-29.41-105.7c0 6.64-2.4 12.73-7.2 18.28-5.87 6.55-12.98 10.33-21.33 11.33-.21-1.42-.32-2.83-.32-4.23 0-6.44 2.53-12.77 7.59-18.99 2.53-3.18 5.68-5.78 9.45-7.8 3.77-2.03 7.42-3.17 10.96-3.43.59 1.62.85 3.23.85 4.84z" />
    </svg>
  );
}

/** Social login and sign-up with Google and Apple. */
export function SocialAuthButtons({ mode = "sign-in" }: { mode?: "sign-in" | "sign-up" }) {
  const [busyProvider, setBusyProvider] = useState<"google" | "apple" | null>(null);

  function handleOAuth(provider: "google" | "apple") {
    setBusyProvider(provider);
    // Direct OAuth entrypoint (redirects to OAuth flow or provider callback)
    // eslint-disable-next-line @next/next/no-location-assign-relative-destination
    window.location.href = `/api/v1/auth/oauth/${provider}?mode=${mode}`;
  }

  const actionText = mode === "sign-up" ? "Sign up" : "Continue";

  return (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {/* Official Google Button with 4-Color G Logo */}
        <button
          type="button"
          onClick={() => handleOAuth("google")}
          disabled={busyProvider !== null}
          className="group relative inline-flex h-11 items-center justify-center gap-2.5 rounded-xl border border-border bg-background px-4 text-[13px] font-medium text-text-primary shadow-soft transition-all duration-150 hover:border-text-secondary/40 hover:bg-canvas hover:shadow-card active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busyProvider === "google" ? (
            <Loader2 className="size-4 animate-spin text-text-secondary" />
          ) : (
            <GoogleIcon className="size-[18px] shrink-0 transition-transform group-hover:scale-105" />
          )}
          <span className="truncate">{actionText} with Google</span>
        </button>

        {/* Official Apple Button with Iconic Silhouette */}
        <button
          type="button"
          onClick={() => handleOAuth("apple")}
          disabled={busyProvider !== null}
          className="group relative inline-flex h-11 items-center justify-center gap-2.5 rounded-xl border border-black bg-black px-4 text-[13px] font-medium text-white shadow-soft transition-all duration-150 hover:bg-neutral-800 hover:shadow-card active:scale-[0.985] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {busyProvider === "apple" ? (
            <Loader2 className="size-4 animate-spin text-white" />
          ) : (
            <AppleIcon className="size-[18px] shrink-0 transition-transform group-hover:scale-105 text-white" />
          )}
          <span className="truncate">{actionText} with Apple</span>
        </button>
      </div>

      {/* Styled Divider */}
      <div className="relative my-2.5 flex items-center justify-center">
        <div className="absolute inset-0 flex items-center" aria-hidden="true">
          <div className="w-full border-t border-border/80" />
        </div>
        <span className="relative bg-background px-3 text-[11px] font-semibold uppercase tracking-wider text-text-secondary">
          or continue with email
        </span>
      </div>
    </div>
  );
}
