"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useState, useSyncExternalStore, type FormEvent } from "react";
import type { components } from "@avenra/contracts";
import { BrandLogo } from "@/components/brand";
import { Alert, Button } from "@/components/ui";
import { api, ApiError, unwrap } from "@/lib/api";
import { readRequestToken } from "@/lib/request-token";
import { errorText, fileBody, KIND_LABELS, stateLabel, stateTone } from "@/lib/work";
import { ValueInput } from "@/components/value-input";

type Item = components["schemas"]["ClientRequestItem"];

/**
 * The page a client opens from a request link (ADR-020). No account: the token
 * from the link is the only credential. It arrives in the URL fragment, which
 * browsers never send to a server, and is sent to the API in a header.
 */
let token: string | null | undefined;

/** Read once per page load: reading moves the token out of the address bar. */
function tokenSnapshot(): string | null {
  if (token === undefined) {
    token = readRequestToken(window);
  }
  return token;
}

const noSubscription = () => () => {};

export default function RequestPage() {
  // Undefined while rendering on the server, where there is no fragment.
  const token = useSyncExternalStore(noSubscription, tokenSnapshot, () => undefined);

  return (
    <div className="min-h-dvh bg-auth-wash p-4 md:p-8">
      <main className="mx-auto max-w-2xl rounded-3xl bg-background p-6 shadow-float md:p-10">
        <div className="mb-8">
          <BrandLogo />
        </div>
        {token === undefined ? <p className="text-[13px] text-text-secondary">Loading…</p> : null}
        {token === null ? <Alert tone="error">This link is incomplete. Open it again from the email you received.</Alert> : null}
        {token ? <Request token={token} /> : null}
      </main>
    </div>
  );
}

function Request({ token }: { token: string }) {
  const header = { "X-Avenra-Request-Token": token };
  const request = useQuery({
    queryKey: ["client-request"],
    queryFn: async () => unwrap(await api.GET("/api/v1/client-requests/current", { params: { header } })),
    retry: false,
  });
  if (request.error) {
    const invalid = request.error instanceof ApiError && request.error.code === "REQUEST_LINK_INVALID";
    return <Alert tone="error">{invalid ? request.error.message : errorText(request.error)}</Alert>;
  }
  if (!request.data) {
    return <p className="text-sm text-text-secondary">Loading…</p>;
  }
  const data = request.data;
  const remaining = data.items.filter((item) => item.required && item.state !== "SUBMITTED" && item.state !== "ACCEPTED").length;
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{data.organizationName} needs some information</h1>
        <p className="mt-2 text-sm text-text-secondary">
          For “{data.workTitle}”. Sent to {data.recipient}. This link works until {new Date(data.expiresAt).toLocaleDateString()}.
        </p>
        {data.message ? <p className="mt-4 rounded-xl border-l-2 border-brand bg-brand-surface px-3 py-2 text-[13px]">{data.message}</p> : null}
      </div>
      {remaining === 0 ? (
        <Alert tone="success">Thank you — everything requested has been sent. You can close this page.</Alert>
      ) : (
        <p className="text-sm text-text-secondary" data-testid="remaining">
          {remaining} required {remaining === 1 ? "item" : "items"} left.
        </p>
      )}
      <ul className="flex flex-col gap-4">
        {data.items.map((item) => (
          <RequestItem key={item.requirementId} item={item} header={header} />
        ))}
      </ul>
      <p className="text-xs text-text-secondary">
        Files are checked for viruses before they are accepted. Do not forward this link: anyone with it can answer.
      </p>
      {data.documentsReadAutomatically ? (
        <p className="text-xs text-text-secondary" data-testid="reading-notice">
          {data.organizationName} has documents read automatically to check them, using an AI service. People at{" "}
          {data.organizationName} make every decision about what you send.
        </p>
      ) : null}
    </div>
  );
}

function RequestItem({ item, header }: { item: Item; header: { "X-Avenra-Request-Token": string } }) {
  const queries = useQueryClient();
  const path = { header, path: { requirementId: item.requirementId } };
  const [value, setValue] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const done = () => void queries.invalidateQueries({ queryKey: ["client-request"] });
  const answer = useMutation({
    mutationFn: async () =>
      unwrap(await api.POST("/api/v1/client-requests/current/requirements/{requirementId}/value", { params: path, body: { value } })),
    onSuccess: () => {
      setValue("");
      done();
    },
  });
  const upload = useMutation({
    mutationFn: async (chosen: File) =>
      unwrap(await api.POST("/api/v1/client-requests/current/requirements/{requirementId}/file", { params: path, ...fileBody(chosen) })),
    onSuccess: () => {
      setFile(null);
      done();
    },
  });
  const open = item.state === "MISSING" || item.state === "REJECTED";

  return (
    <li className="rounded-lg border border-border p-4" data-testid={`item-${item.title}`}>
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-medium">
            {item.title}
            {item.required ? "" : <span className="font-normal text-text-secondary"> · optional</span>}
          </p>
          {item.instructions ? <p className="mt-1 text-sm text-text-secondary">{item.instructions}</p> : null}
        </div>
        <span className={`shrink-0 text-sm font-medium ${stateTone(item.state)}`} data-testid="item-state">
          {item.state === "SUBMITTED" ? "Received" : stateLabel(item.state)}
        </span>
      </div>
      {item.state === "REJECTED" && item.problems && item.problems.length > 0 ? (
        <div className="mt-3">
          <Alert tone="error">
            Please correct this:
            <ul className="mt-1 list-inside list-disc" data-testid="problems">
              {item.problems.map((problem) => (
                <li key={problem}>{problem}</li>
              ))}
            </ul>
          </Alert>
        </div>
      ) : item.state === "REJECTED" && item.rejectionReason ? (
        <div className="mt-3">
          <Alert tone="error">Please correct this: {item.rejectionReason}</Alert>
        </div>
      ) : null}
      {open ? (
        item.kind === "DOCUMENT" ? (
          <form
            className="mt-3 flex flex-wrap items-center gap-3"
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              if (file) upload.mutate(file);
            }}
          >
            <input
              type="file"
              aria-label={`File for ${item.title}`}
              accept={(item.acceptedFileTypes ?? []).map((extension) => `.${extension}`).join(",")}
              onChange={(event) => setFile(event.target.files?.[0] ?? null)}
              className="text-sm"
            />
            <Button type="submit" disabled={!file} busy={upload.isPending}>
              Upload
            </Button>
            <p className="w-full text-xs text-text-secondary">
              {KIND_LABELS[item.kind]}: {(item.acceptedFileTypes ?? []).join(", ").toUpperCase()}, up to 25 MB.
            </p>
          </form>
        ) : (
          <form
            className="mt-3 flex items-end gap-3"
            onSubmit={(event: FormEvent) => {
              event.preventDefault();
              answer.mutate();
            }}
          >
            <div className="flex-1">
              <ValueInput kind={item.kind} label={`Answer for ${item.title}`} value={value} onChange={setValue} />
            </div>
            <Button type="submit" busy={answer.isPending}>
              Send
            </Button>
          </form>
        )
      ) : null}
      {errorText(answer.error ?? upload.error) ? (
        <div className="mt-3">
          <Alert tone="error">{errorText(answer.error ?? upload.error)}</Alert>
        </div>
      ) : null}
    </li>
  );
}
