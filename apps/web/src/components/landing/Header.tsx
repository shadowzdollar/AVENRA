"use client";

import Link from "next/link";
import { ChevronDown, Menu, X } from "lucide-react";
import { useState } from "react";
import { BrandLogo } from "@/components/brand";
import { Button, LinkButton } from "./button";

const links = [
  { label: "Platform", href: "#platform" },
  { label: "How it works", href: "#how-it-works", dropdown: true },
  { label: "Use cases", href: "#use-cases", badge: true },
  { label: "Pricing", href: "#pricing" },
  { label: "Customers", href: "#customers" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  return (
    <header className="hero-header">
      <div className="hero-nav">
        <Link href="/" aria-label="Avenra home"><BrandLogo /></Link>
        <nav className="hidden items-center gap-7 lg:flex" aria-label="Main navigation">
          {links.map((link) => (
            <a key={link.href} href={link.href} className="flex items-center gap-1.5 text-xs font-medium text-text-primary transition-colors hover:text-brand">
              {link.label}{link.dropdown && <ChevronDown className="size-3" />}
              {link.badge && <span className="rounded-sm bg-brand-surface px-1 py-0.5 text-[8px] text-brand">NEW</span>}
            </a>
          ))}
        </nav>
        <div className="hidden items-center gap-3 md:flex">
          <LinkButton href="/sign-in" variant="outline" size="sm">Sign in</LinkButton>
          <LinkButton href="/sign-up" size="sm" className="px-5">Contact</LinkButton>
        </div>
        <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setOpen(!open)} aria-label="Toggle menu" aria-expanded={open}>
          {open ? <X /> : <Menu />}
        </Button>
      </div>
      {open && (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 rounded-lg border border-border bg-background p-4 shadow-float md:hidden">
          {links.map((link) => <a key={link.href} href={link.href} onClick={() => setOpen(false)} className="block py-2 text-sm">{link.label}</a>)}
          <div className="mt-3 flex gap-2">
            <LinkButton href="/sign-in" variant="outline" className="flex-1">Sign in</LinkButton>
            <LinkButton href="/sign-up" className="flex-1">Contact</LinkButton>
          </div>
        </div>
      )}
    </header>
  );
}
