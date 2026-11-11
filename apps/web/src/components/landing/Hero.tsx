"use client";

import { CheckCircle2, MoreVertical, Star, ShieldCheck } from "lucide-react";
import { SiAmazons3, SiBackblaze, SiCloudflare, SiDigitalocean, SiGmail, SiMake, SiMinio, SiN8N, SiWasabi, SiZapier } from "react-icons/si";
import { LinkButton } from "./button";
import { Header } from "./Header";

const portrait = "/landing/testimonial.jpg";

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
            <div className="orbit-pos-top-left">
              <div className="hero-app-bubble counter-outer" title="Zapier">
                <SiZapier className="hero-app-icon logo-zapier" aria-label="Zapier" />
              </div>
            </div>
            <div className="orbit-pos-top-right">
              <div className="hero-app-bubble counter-outer" title="Cloudflare R2">
                <SiCloudflare className="hero-app-icon logo-cloudflare" aria-label="Cloudflare R2" />
              </div>
            </div>
            <div className="orbit-pos-bottom-right">
              <div className="hero-app-bubble counter-outer" title="Wasabi">
                <SiWasabi className="hero-app-icon logo-wasabi" aria-label="Wasabi" />
              </div>
            </div>
            <div className="orbit-pos-bottom-left">
              <div className="hero-app-bubble counter-outer" title="Backblaze B2">
                <SiBackblaze className="hero-app-icon logo-backblaze" aria-label="Backblaze B2" />
              </div>
            </div>
          </div>

          {/* Middle Orbit (Counter-Clockwise revolution) */}
          <div className="hero-orbit hero-orbit-middle orbit-rev-middle">
            <span className="orbit-point point-top-right" />
            <div className="orbit-pos-top">
              <div className="hero-app-bubble counter-middle" title="Amazon S3">
                <SiAmazons3 className="hero-app-icon logo-s3" aria-label="Amazon S3" />
              </div>
            </div>
            <div className="orbit-pos-right">
              <div className="hero-app-bubble counter-middle" title="n8n">
                <SiN8N className="hero-app-icon logo-n8n" aria-label="n8n" />
              </div>
            </div>
            <div className="orbit-pos-bottom">
              <div className="hero-app-bubble counter-middle" title="MinIO">
                <SiMinio className="hero-app-icon logo-minio" aria-label="MinIO" />
              </div>
            </div>
            <div className="orbit-pos-left">
              <div className="hero-app-bubble counter-middle" title="Make">
                <SiMake className="hero-app-icon logo-make" aria-label="Make" />
              </div>
            </div>
          </div>

          {/* Inner Orbit (Clockwise revolution) */}
          <div className="hero-orbit hero-orbit-inner orbit-rev-inner">
            <span className="orbit-point point-bottom-left" />
            <div className="orbit-pos-top-right">
              <div className="hero-app-bubble counter-inner" title="Gmail">
                <SiGmail className="hero-app-icon logo-gmail" aria-label="Gmail" />
              </div>
            </div>
            <div className="orbit-pos-bottom-left">
              <div className="hero-app-bubble counter-inner" title="DigitalOcean Spaces">
                <SiDigitalocean className="hero-app-icon logo-digitalocean" aria-label="DigitalOcean Spaces" />
              </div>
            </div>
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
