import type { IconType } from "react-icons";
import { SiAmazons3, SiBackblaze, SiCloudflare, SiDigitalocean, SiGmail, SiMake, SiMinio, SiN8N, SiWasabi, SiZapier } from "react-icons/si";

/*
 * Services Avenra works with today (ADR-039): S3-compatible storage for the
 * evidence export, automation tools that receive Avenra's signed webhooks,
 * and the mailboxes client requests arrive in (ADR-034). Third-party marks keep
 * their official colours, set by class because the CSP blocks inline styles.
 */
export const integrations: { name: string; icon: IconType; logo: string; category: string }[] = [
  { name: "Gmail", icon: SiGmail, logo: "logo-gmail", category: "Client requests by email" },
  { name: "Amazon S3", icon: SiAmazons3, logo: "logo-s3", category: "Evidence export" },
  { name: "Cloudflare R2", icon: SiCloudflare, logo: "logo-cloudflare", category: "Evidence export" },
  { name: "Backblaze B2", icon: SiBackblaze, logo: "logo-backblaze", category: "Evidence export" },
  { name: "DigitalOcean Spaces", icon: SiDigitalocean, logo: "logo-digitalocean", category: "Evidence export" },
  { name: "MinIO", icon: SiMinio, logo: "logo-minio", category: "Evidence export" },
  { name: "Wasabi", icon: SiWasabi, logo: "logo-wasabi", category: "Evidence export" },
  { name: "Zapier", icon: SiZapier, logo: "logo-zapier", category: "Webhooks" },
  { name: "Make", icon: SiMake, logo: "logo-make", category: "Webhooks" },
  { name: "n8n", icon: SiN8N, logo: "logo-n8n", category: "Webhooks" },
];

export function IntegrationBubble({ name, className = "", size = "md" }: { name: string; className?: string; size?: "sm" | "md" | "lg" }) {
  const it = integrations.find((i) => i.name === name) ?? integrations[0]!;
  const Icon = it.icon;
  const dims = { sm: "size-9 rounded-lg", md: "size-12 rounded-xl", lg: "size-14 rounded-2xl" }[size];
  const icon = { sm: 16, md: 22, lg: 26 }[size];
  return (
    <div className={`flex items-center justify-center border border-border bg-background shadow-float ${dims} ${className}`} title={it.name}>
      <Icon size={icon} className={it.logo} aria-label={it.name} />
    </div>
  );
}
