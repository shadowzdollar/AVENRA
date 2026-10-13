import { ApiStatusPanel } from "./api-status-panel";

export default function HomePage() {
  return (
    <div className="min-h-dvh">
      <header className="border-b border-border">
        <div className="mx-auto flex h-14 max-w-5xl items-center gap-3 px-6">
          {/* A plain img: next/image adds an inline style attribute, which the strict
              CSP blocks, and this tiny static logo gains nothing from optimization. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/avenra-symbol.png" alt="" width={28} height={28} />
          <span className="text-base font-semibold tracking-tight">Avenra</span>
        </div>
      </header>

      <main className="mx-auto max-w-5xl px-6 py-16">
        <h1 className="text-3xl font-semibold tracking-tight">From Intent to Completed Work.</h1>
        <p className="mt-3 max-w-xl text-text-secondary">
          The platform foundation is running. Work, information and verification arrive in the next phases.
        </p>

        <section aria-labelledby="system-heading" className="mt-10 rounded-lg border border-border p-5">
          <h2 id="system-heading" className="text-sm font-medium">
            System
          </h2>
          <div className="mt-3">
            <ApiStatusPanel />
          </div>
        </section>
      </main>
    </div>
  );
}
