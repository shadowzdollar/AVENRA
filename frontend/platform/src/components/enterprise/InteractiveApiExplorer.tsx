"use client";

import {
  Check,
  Copy,
  Terminal,
} from "lucide-react";
import { useState } from "react";

type Language = "typescript" | "curl" | "python" | "java";
type Scenario = "create-work" | "magic-portal" | "webhook-hmac" | "export-evidence";

interface CodeSnippet {
  title: string;
  endpoint: string;
  snippets: Record<Language, string>;
}

const SCENARIOS: Record<Scenario, CodeSnippet> = {
  "create-work": {
    title: "1. Create Work Deliverable",
    endpoint: "POST /api/v1/organizations/{organizationId}/work",
    snippets: {
      typescript: `import { createAvenraClient } from "@avenra/contracts";

const avenra = createAvenraClient({
  baseUrl: "https://api.avenra.com",
  token: process.env.AVENRA_API_KEY
});

// Initializing work with server-side tenant isolation
const { data: work } = await avenra.POST("/api/v1/organizations/{organizationId}/work", {
  params: { path: { organizationId: "org_northwind" } },
  body: {
    title: "Subsidiary Formation & Statutory KYC",
    clientIdentifier: "cli_apex_holdings",
    priority: "HIGH",
    tags: ["corporate", "kyc", "q4"]
  }
});

console.log("Work initialized in state:", work.status); // PENDING`,
      curl: `curl -X POST "https://api.avenra.com/api/v1/organizations/org_northwind/work" \\
  -H "Authorization: Bearer av_sec_9841029471b0" \\
  -H "Content-Type: application/json" \\
  -d '{
    "title": "Subsidiary Formation & Statutory KYC",
    "clientIdentifier": "cli_apex_holdings",
    "priority": "HIGH",
    "tags": ["corporate", "kyc", "q4"]
  }'`,
      python: `import httpx

async with httpx.AsyncClient(base_url="https://api.avenra.com") as client:
    response = await client.post(
        "/api/v1/organizations/org_northwind/work",
        headers={"Authorization": f"Bearer {API_KEY}"},
        json={
            "title": "Subsidiary Formation & Statutory KYC",
            "clientIdentifier": "cli_apex_holdings",
            "priority": "HIGH",
            "tags": ["corporate", "kyc", "q4"]
        }
    )
    work = response.json()
    assert work["status"] == "PENDING"`,
      java: `RestClient client = RestClient.builder()
    .baseUrl("https://api.avenra.com")
    .defaultHeader("Authorization", "Bearer " + apiKey)
    .build();

CreateWorkResponse work = client.post()
    .uri("/api/v1/organizations/{orgId}/work", "org_northwind")
    .contentType(MediaType.APPLICATION_JSON)
    .body(new CreateWorkRequest(
        "Subsidiary Formation & Statutory KYC",
        "cli_apex_holdings",
        Priority.HIGH,
        List.of("corporate", "kyc", "q4")
    ))
    .retrieve()
    .body(CreateWorkResponse.class);`,
    },
  },
  "magic-portal": {
    title: "2. Dispatch Magic Client Request",
    endpoint: "POST /api/v1/organizations/{organizationId}/requests",
    snippets: {
      typescript: `// Dispatch single-use, passwordless magic portal link
const { data: request } = await avenra.POST("/api/v1/organizations/{organizationId}/requests", {
  params: { path: { organizationId: "org_northwind" } },
  body: {
    workId: work.id,
    recipientEmail: "cfo@apexholdings.com",
    title: "Please upload Certificate of Incumbency & Photo IDs",
    expiresInDays: 7,
    requiredItems: [
      { name: "incorporation_cert.pdf", type: "DOCUMENT" },
      { name: "director_id_passport.pdf", type: "DOCUMENT" }
    ]
  }
});

// Dispatches branded email with single-use magic token:
// https://app.avenra.com/request?token=mgt_98f1a029...`,
      curl: `curl -X POST "https://api.avenra.com/api/v1/organizations/org_northwind/requests" \\
  -H "Authorization: Bearer av_sec_9841029471b0" \\
  -H "Content-Type: application/json" \\
  -d '{
    "workId": "wrk_01HZX892KLA",
    "recipientEmail": "cfo@apexholdings.com",
    "title": "Please upload Certificate of Incumbency & Photo IDs",
    "expiresInDays": 7
  }'`,
      python: `response = await client.post(
    "/api/v1/organizations/org_northwind/requests",
    headers={"Authorization": f"Bearer {API_KEY}"},
    json={
        "workId": work_id,
        "recipientEmail": "cfo@apexholdings.com",
        "title": "Please upload Certificate of Incumbency & Photo IDs",
        "expiresInDays": 7
    }
)`,
      java: `CreateRequestLinkResponse link = client.post()
    .uri("/api/v1/organizations/{orgId}/requests", "org_northwind")
    .contentType(MediaType.APPLICATION_JSON)
    .body(new CreateRequestLinkRequest(
        workId,
        "cfo@apexholdings.com",
        "Please upload Certificate of Incumbency & Photo IDs",
        7
    ))
    .retrieve()
    .body(CreateRequestLinkResponse.class);`,
    },
  },
  "webhook-hmac": {
    title: "3. Verify Webhook HMAC Signature",
    endpoint: "Incoming Webhook from Avenra",
    snippets: {
      typescript: `import crypto from "crypto";

export function verifyAvenraWebhook(payload: string, signature: string, secret: string): boolean {
  const expected = crypto
    .createHmac("sha256", secret)
    .update(payload)
    .digest("hex");
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  );
}`,
      curl: `# Test local webhook receiver with HMAC signature
curl -X POST "http://localhost:4000/webhook" \\
  -H "X-Avenra-Signature: 8f4e2b10a9c3d4e5f6a7b8c9d0e1f2a3..." \\
  -H "Content-Type: application/json" \\
  -d '{"event":"work.completed","workId":"wrk_01HZX892KLA"}'`,
      python: `import hmac
import hashlib

def verify_avenra_webhook(payload: bytes, signature: str, secret: str) -> bool:
    expected = hmac.new(
        secret.encode(),
        payload,
        hashlib.sha256
    ).hexdigest()
    return hmac.compare_digest(signature, expected)`,
      java: `public boolean verifyWebhook(byte[] payload, String signature, String secret) throws Exception {
    Mac mac = Mac.getInstance("HmacSHA256");
    mac.init(new SecretKeySpec(secret.getBytes(StandardCharsets.UTF_8), "HmacSHA256"));
    byte[] hash = mac.doFinal(payload);
    String expected = HexFormat.of().formatHex(hash);
    return MessageDigest.isEqual(
        signature.getBytes(StandardCharsets.UTF_8),
        expected.getBytes(StandardCharsets.UTF_8)
    );
}`,
    },
  },
  "export-evidence": {
    title: "4. Download Sealed Evidence Pack",
    endpoint: "GET /api/v1/organizations/{organizationId}/evidence/{id}",
    snippets: {
      typescript: `// Retrieve tamper-proof evidence pack and S3 storage location
const { data: evidence } = await avenra.GET(
  "/api/v1/organizations/{organizationId}/evidence/{id}",
  {
    params: {
      path: { organizationId: "org_northwind", id: work.id }
    }
  }
);

console.log("SHA-256 Checksum:", evidence.sha256);
console.log("Direct S3 Custody:", evidence.s3Uri);
console.log("Presigned Download URL:", evidence.downloadUrl);`,
      curl: `curl "https://api.avenra.com/api/v1/organizations/org_northwind/evidence/wrk_01HZX892KLA" \\
  -H "Authorization: Bearer av_sec_9841029471b0"`,
      python: `response = await client.get(
    f"/api/v1/organizations/org_northwind/evidence/{work_id}",
    headers={"Authorization": f"Bearer {API_KEY}"}
)
evidence = response.json()
print("Evidence SHA-256:", evidence["sha256"])
print("S3 Custody Location:", evidence["s3Uri"])`,
      java: `EvidencePackage evidence = client.get()
    .uri("/api/v1/organizations/{orgId}/evidence/{id}", "org_northwind", workId)
    .retrieve()
    .body(EvidencePackage.class);

System.out.println("SHA-256: " + evidence.sha256());
System.out.println("S3 Bucket Location: " + evidence.s3Uri());`,
    },
  },
};

export function InteractiveApiExplorer() {
  const [activeScenario, setActiveScenario] = useState<Scenario>("create-work");
  const [activeLang, setActiveLang] = useState<Language>("typescript");
  const [copied, setCopied] = useState(false);

  const scenario = SCENARIOS[activeScenario];
  const code = scenario.snippets[activeLang];

  function copyCode() {
    void navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="rounded-3xl border border-border bg-canvas overflow-hidden shadow-card">
      {/* Top Bar with Scenarios */}
      <div className="border-b border-border bg-background px-6 py-4 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2.5">
          <Terminal className="size-5 text-brand" />
          <span className="text-sm font-bold text-text-primary">
            Interactive Enterprise API & SDK Explorer
          </span>
        </div>
        <span className="rounded-full bg-brand-surface px-2.5 py-0.5 text-[10px] font-bold text-brand">
          OPENAPI V1 SPECIFICATION
        </span>
      </div>

      {/* Scenario Tabs */}
      <div className="flex flex-wrap border-b border-border bg-background/50">
        {(Object.keys(SCENARIOS) as Scenario[]).map((key) => {
          const item = SCENARIOS[key];
          const isSelected = key === activeScenario;
          return (
            <button
              key={key}
              type="button"
              onClick={() => setActiveScenario(key)}
              className={`px-4 py-3 text-xs font-semibold transition-all border-b-2 ${
                isSelected
                  ? "border-b-brand text-brand bg-canvas"
                  : "border-b-transparent text-text-secondary hover:text-text-primary"
              }`}
            >
              {item.title}
            </button>
          );
        })}
      </div>

      {/* Language Switcher & Endpoint Bar */}
      <div className="px-6 py-3 border-b border-border bg-background flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-2 font-mono text-xs text-text-secondary">
          <span className="rounded bg-brand-surface px-2 py-0.5 text-[10px] font-bold text-brand uppercase">
            ENDPOINT
          </span>
          <span className="text-text-primary font-bold">{scenario.endpoint}</span>
        </div>

        <div className="flex items-center gap-2">
          {(["typescript", "curl", "python", "java"] as Language[]).map((lang) => (
            <button
              key={lang}
              type="button"
              onClick={() => setActiveLang(lang)}
              className={`rounded-lg px-2.5 py-1 text-xs font-semibold capitalize transition-all ${
                activeLang === lang
                  ? "bg-brand text-background shadow-sm"
                  : "text-text-secondary hover:bg-canvas"
              }`}
            >
              {lang}
            </button>
          ))}
          <button
            type="button"
            onClick={copyCode}
            className="ml-2 inline-flex items-center gap-1 rounded-lg border border-border bg-canvas px-2.5 py-1 text-xs font-medium text-text-secondary hover:text-text-primary"
          >
            {copied ? <Check className="size-3.5 text-success" /> : <Copy className="size-3.5" />}
            <span>{copied ? "Copied" : "Copy"}</span>
          </button>
        </div>
      </div>

      {/* Code Display Area */}
      <div className="p-6 bg-canvas overflow-x-auto font-mono text-xs text-text-primary leading-relaxed">
        <pre>{code}</pre>
      </div>
    </div>
  );
}
