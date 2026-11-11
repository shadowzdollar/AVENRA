"use client";

import { CheckCircle2, MoreVertical, Star, ShieldCheck } from "lucide-react";
import { SiGmail } from "react-icons/si";
import { LinkButton } from "./button";
import { Header } from "./Header";

const portrait = "/landing/testimonial.jpg";

interface PartnerLogo {
  id: string;
  name: string;
  logo: string;
  posClass: string;
}

const OUTER_PARTNERS: PartnerLogo[] = [
  { id: "microsoft365", name: "Microsoft 365", logo: "/logos/microsoft365.svg", posClass: "orbit-pos-12-0" },
  { id: "aws", name: "Amazon Web Services", logo: "/logos/aws.svg", posClass: "orbit-pos-12-1" },
  { id: "cloudflare", name: "Cloudflare", logo: "/logos/cloudflare.svg", posClass: "orbit-pos-12-2" },
  { id: "google-workspace", name: "Google Workspace", logo: "/logos/google-workspace.svg", posClass: "orbit-pos-12-3" },
  { id: "openai", name: "OpenAI", logo: "/logos/openai.svg", posClass: "orbit-pos-12-4" },
  { id: "anthropic", name: "Anthropic", logo: "/logos/anthropic.svg", posClass: "orbit-pos-12-5" },
  { id: "stripe", name: "Stripe", logo: "/logos/stripe.svg", posClass: "orbit-pos-12-6" },
  { id: "salesforce", name: "Salesforce", logo: "/logos/salesforce.svg", posClass: "orbit-pos-12-7" },
  { id: "okta", name: "Okta", logo: "/logos/okta.svg", posClass: "orbit-pos-12-8" },
  { id: "entra", name: "Microsoft Entra ID", logo: "/logos/entra.svg", posClass: "orbit-pos-12-9" },
  { id: "digitalocean", name: "DigitalOcean", logo: "/logos/digitalocean.svg", posClass: "orbit-pos-12-10" },
  { id: "backblaze", name: "Backblaze B2", logo: "/logos/backblaze.svg", posClass: "orbit-pos-12-11" },
];

const MIDDLE_PARTNERS: PartnerLogo[] = [
  { id: "sharepoint", name: "Microsoft SharePoint", logo: "/logos/sharepoint.svg", posClass: "orbit-pos-10m-0" },
  { id: "onedrive", name: "Microsoft OneDrive", logo: "/logos/onedrive.svg", posClass: "orbit-pos-10m-1" },
  { id: "box", name: "Box", logo: "/logos/box.svg", posClass: "orbit-pos-10m-2" },
  { id: "wasabi", name: "Wasabi", logo: "/logos/wasabi.svg", posClass: "orbit-pos-10m-3" },
  { id: "minio", name: "MinIO", logo: "/logos/minio.svg", posClass: "orbit-pos-10m-4" },
  { id: "zapier", name: "Zapier", logo: "/logos/zapier.svg", posClass: "orbit-pos-10m-5" },
  { id: "make", name: "Make", logo: "/logos/make.svg", posClass: "orbit-pos-10m-6" },
  { id: "n8n", name: "n8n", logo: "/logos/n8n.svg", posClass: "orbit-pos-10m-7" },
  { id: "twilio", name: "Twilio", logo: "/logos/twilio.svg", posClass: "orbit-pos-10m-8" },
  { id: "sendgrid", name: "Twilio SendGrid", logo: "/logos/sendgrid.svg", posClass: "orbit-pos-10m-9" },
];

const INNER_PARTNERS: PartnerLogo[] = [
  { id: "imanage", name: "iManage", logo: "/logos/imanage.svg", posClass: "orbit-pos-10i-0" },
  { id: "netdocuments", name: "NetDocuments", logo: "/logos/netdocuments.svg", posClass: "orbit-pos-10i-1" },
  { id: "karbon", name: "Karbon", logo: "/logos/karbon.svg", posClass: "orbit-pos-10i-2" },
  { id: "wolters-kluwer", name: "Wolters Kluwer / CCH Axcess", logo: "/logos/wolters-kluwer.svg", posClass: "orbit-pos-10i-3" },
  { id: "xero", name: "Xero", logo: "/logos/xero.svg", posClass: "orbit-pos-10i-4" },
  { id: "clio", name: "Clio", logo: "/logos/clio.svg", posClass: "orbit-pos-10i-5" },
  { id: "smokeball", name: "Smokeball", logo: "/logos/smokeball.svg", posClass: "orbit-pos-10i-6" },
  { id: "hubspot", name: "HubSpot", logo: "/logos/hubspot.svg", posClass: "orbit-pos-10i-7" },
  { id: "vanta", name: "Vanta", logo: "/logos/vanta.svg", posClass: "orbit-pos-10i-8" },
  { id: "drata", name: "Drata", logo: "/logos/drata.svg", posClass: "orbit-pos-10i-9" },
];

export function Hero() {
  return (
    <section className="reference-hero">
      <Header />
      <div className="hero-stage">
        <div className="hero-orbits" aria-hidden="true">
          {/* Outer Orbit (Clockwise revolution) */}
          <div className="hero-orbit hero-orbit-outer orbit-rev-outer">
            <span className="orbit-point point-left" />
            <span className="orbit-point point-bottom-right" />
            {OUTER_PARTNERS.map((partner) => (
              <div key={partner.id} className={partner.posClass}>
                <div className="hero-app-bubble counter-outer" title={partner.name}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- CSP nonce rules apply */}
                  <img src={partner.logo} alt={partner.name} className="hero-app-img" loading="eager" />
                </div>
              </div>
            ))}
          </div>

          {/* Middle Orbit (Counter-Clockwise revolution) */}
          <div className="hero-orbit hero-orbit-middle orbit-rev-middle">
            <span className="orbit-point point-top-right" />
            {MIDDLE_PARTNERS.map((partner) => (
              <div key={partner.id} className={partner.posClass}>
                <div className="hero-app-bubble counter-middle" title={partner.name}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- CSP nonce rules apply */}
                  <img src={partner.logo} alt={partner.name} className="hero-app-img" loading="eager" />
                </div>
              </div>
            ))}
          </div>

          {/* Inner Orbit (Clockwise revolution) */}
          <div className="hero-orbit hero-orbit-inner orbit-rev-inner">
            <span className="orbit-point point-bottom-left" />
            {INNER_PARTNERS.map((partner) => (
              <div key={partner.id} className={partner.posClass}>
                <div className="hero-app-bubble counter-inner" title={partner.name}>
                  {/* eslint-disable-next-line @next/next/no-img-element -- CSP nonce rules apply */}
                  <img src={partner.logo} alt={partner.name} className="hero-app-img" loading="eager" />
                </div>
              </div>
            ))}
          </div>
        </div>
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
