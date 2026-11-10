"use client";

import { CheckCircle2, MoreVertical, Star, ShieldCheck } from "lucide-react";
import { SiAmazons3, SiBackblaze, SiCloudflare, SiDigitalocean, SiGmail, SiMake, SiMinio, SiN8N, SiWasabi, SiZapier } from "react-icons/si";
import type { IconType } from "react-icons";
import { LinkButton } from "./button";
import { Header } from "./Header";

const portrait = "/landing/testimonial.jpg";

/** Services Avenra works with (see Integrations.tsx), in the design's orbit positions. */
const floating: { name: string; icon: IconType; position: string; brand: string }[] = [
  { name: "Zapier", icon: SiZapier, position: "orbit-slack", brand: "logo-zapier" },
  { name: "Amazon S3", icon: SiAmazons3, position: "orbit-asana", brand: "logo-s3" },
  { name: "Make", icon: SiMake, position: "orbit-meta", brand: "logo-make" },
  { name: "Gmail", icon: SiGmail, position: "orbit-mail", brand: "logo-gmail" },
  { name: "Backblaze B2", icon: SiBackblaze, position: "orbit-drive", brand: "logo-backblaze" },
  { name: "n8n", icon: SiN8N, position: "orbit-zapier", brand: "logo-n8n" },
  { name: "Cloudflare R2", icon: SiCloudflare, position: "orbit-aws", brand: "logo-cloudflare" },
  { name: "DigitalOcean Spaces", icon: SiDigitalocean, position: "orbit-flow", brand: "logo-digitalocean" },
  { name: "MinIO", icon: SiMinio, position: "orbit-click", brand: "logo-minio" },
  { name: "Wasabi", icon: SiWasabi, position: "orbit-airtable", brand: "logo-wasabi" },
];

export function Hero() {
  return (
    <section className="reference-hero">
      <Header />
      <div className="hero-stage">
        <div className="hero-orbits" aria-hidden="true">
          <div className="hero-orbit hero-orbit-outer" />
          <div className="hero-orbit hero-orbit-middle" />
          <div className="hero-orbit hero-orbit-inner" />
          <span className="orbit-point point-left" /><span className="orbit-point point-bottom-left" />
          <span className="orbit-point point-top-right" /><span className="orbit-point point-bottom-right" />
        </div>
        {floating.map(({ name, icon: Icon, position, brand }) => (
          <div key={position} className={`hero-app-bubble ${position}`} title={name}>
            <Icon className={`hero-app-icon ${brand}`} aria-label={name} />
          </div>
        ))}
        <div className="hero-copy">
          <div className="hero-trust-badge">
            <span><ShieldCheck className="size-4 text-brand" /> Design partners</span>
            <span><Star className="size-4 fill-success text-success" /> People in control</span>
          </div>
          <h1><span className="text-brand">From intent</span> to<br />completed work.</h1>
          <p>Find, collect, and verify the information your client work<br className="hidden sm:block" /> depends on — then move it to a verified outcome.</p>
          <div className="hero-actions">
            <LinkButton href="/sign-up" size="lg" className="rounded-lg">Get started</LinkButton>
            <LinkButton href="/sign-up" variant="outline" size="lg" className="rounded-lg border-brand text-brand">Talk to our team</LinkButton>
          </div>
          <NotificationStack />
        </div>
      </div>
    </section>
  );
}

function NotificationStack() {
  return (
    <div className="hero-notifications" aria-label="Example Avenra activity">
      <div className="notification-art" aria-hidden="true"><span className="notification-dots dots-left" /><span className="notification-dots dots-right" /><span className="notification-arrow" /><span className="notification-strokes">≋</span></div>
      <div className="hero-notification notification-first">
        <div className="notification-avatar">
          {/* eslint-disable-next-line @next/next/no-img-element -- the CSP blocks next/image's inline style */}
          <img src={portrait} alt="" /><CheckCircle2 /></div>
        <div className="notification-copy"><strong>Client onboarding verified</strong><span>1 min ago · Northwind Legal</span></div>
      </div>
      <div className="hero-notification notification-second">
        <div className="notification-avatar avatar-alt">
          {/* eslint-disable-next-line @next/next/no-img-element -- the CSP blocks next/image's inline style */}
          <img src={portrait} alt="" /><CheckCircle2 /></div>
        <div className="notification-copy"><strong>Audit pack ready for review</strong><span>Evidence collected · Halden & Co.</span></div>
        <MoreVertical className="size-4 shrink-0" />
      </div>
      <div className="hero-notification notification-third">
        <SiGmail className="size-7 shrink-0 logo-gmail" />
        <div className="notification-copy"><strong>Brightline Studio</strong><span>Approved the statement of work…</span></div>
      </div>
    </div>
  );
}

export function TrustedBy() {
  return (
    <section className="hero-trusted">
      <p>Built for operations teams at professional services firms</p>
      <div className="hero-trusted-logos">
        <span className="trusted-google">Northwind</span><span className="trusted-airbnb">Halden & Co.</span>
        <span className="trusted-coinbase">brightline</span><span className="trusted-notion">▧ Meridian</span>
        <span className="trusted-gumroad">Kestrel</span><span className="trusted-paypal">Oakmont</span>
        <span className="trusted-upwork">fieldwork</span><span className="trusted-shopify">Atlas</span>
      </div>
    </section>
  );
}
