"use client";

import {
  ChevronDown,
  Menu,
  X,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { BrandLogo } from "@/components/brand";
import { Button, LinkButton } from "./button";
import {
  HowItWorksMenu,
  IntegrationsMenu,
  PlatformMenu,
  SecurityMenu,
  SolutionsMenu,
  type MegaMenuCategory,
} from "./MegaMenu";

interface NavCategory {
  id: MegaMenuCategory;
  label: string;
  badge?: string;
  href: string;
}

const NAV_CATEGORIES: NavCategory[] = [
  { id: "platform", label: "Platform", href: "/platform", badge: "ENGINE" },
  { id: "solutions", label: "Solutions", href: "/solutions" },
  { id: "how-it-works", label: "How it works", href: "/how-it-works" },
  { id: "integrations", label: "Integrations", href: "/integrations" },
  { id: "security", label: "Security & Trust", href: "/security" },
];

export function Header() {
  const [activeCategory, setActiveCategory] = useState<MegaMenuCategory | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<MegaMenuCategory | null>(null);
  const headerRef = useRef<HTMLElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  function handleMouseEnter(category: MegaMenuCategory) {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);
    setActiveCategory(category);
  }

  function handleMouseLeave() {
    timeoutRef.current = setTimeout(() => {
      setActiveCategory(null);
    }, 180);
  }

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setActiveCategory(null);
        setMobileOpen(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  return (
    <header
      ref={headerRef}
      onMouseLeave={handleMouseLeave}
      className="hero-header relative z-50"
    >
      <div className="hero-nav relative">
        <Link href="/" aria-label="Avenra home" onClick={() => setActiveCategory(null)}>
          <BrandLogo />
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Main navigation">
          {NAV_CATEGORIES.map((category) => {
            const isOpen = activeCategory === category.id;
            return (
              <div
                key={category.id}
                onMouseEnter={() => handleMouseEnter(category.id)}
                className="relative py-3"
              >
                <button
                  type="button"
                  onClick={() => setActiveCategory(isOpen ? null : category.id)}
                  aria-expanded={isOpen}
                  className={`flex items-center gap-1.5 text-xs font-medium transition-colors hover:text-brand ${
                    isOpen ? "text-brand" : "text-text-primary"
                  }`}
                >
                  <span>{category.label}</span>
                  <ChevronDown
                    className={`size-3 transition-transform duration-200 ${
                      isOpen ? "rotate-180 text-brand" : "text-text-secondary"
                    }`}
                  />
                  {category.badge && (
                    <span className="rounded bg-brand-surface px-1.5 py-0.5 text-[8px] font-bold text-brand">
                      {category.badge}
                    </span>
                  )}
                </button>
              </div>
            );
          })}
          <Link
            href="/pricing"
            onClick={() => setActiveCategory(null)}
            className="text-xs font-medium text-text-primary transition-colors hover:text-brand"
          >
            Pricing
          </Link>
          <Link
            href="/docs"
            onClick={() => setActiveCategory(null)}
            className="text-xs font-medium text-text-primary transition-colors hover:text-brand"
          >
            Docs
          </Link>
        </nav>

        {/* Action Buttons */}
        <div className="hidden items-center gap-3 md:flex">
          <LinkButton href="/sign-in" variant="outline" size="sm">
            Sign in
          </LinkButton>
          <LinkButton href="/sign-up" size="sm" className="px-5">
            Get started
          </LinkButton>
        </div>

        {/* Mobile Hamburger Toggle */}
        <Button
          variant="ghost"
          size="icon"
          className="md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
          aria-label="Toggle menu"
          aria-expanded={mobileOpen}
        >
          {mobileOpen ? <X className="size-5" /> : <Menu className="size-5" />}
        </Button>
      </div>

      {/* Desktop Mega Dropdown Container */}
      {activeCategory && (
        <div
          onMouseEnter={() => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
          }}
          onMouseLeave={handleMouseLeave}
          className="absolute left-1/2 top-[calc(100%+8px)] z-50 w-[min(96vw,1560px)] -translate-x-1/2 overflow-hidden rounded-2xl border border-border bg-background/95 backdrop-blur-xl shadow-2xl transition-all duration-200 animate-in fade-in slide-in-from-top-2"
        >
          {activeCategory === "platform" && (
            <PlatformMenu onClose={() => setActiveCategory(null)} />
          )}
          {activeCategory === "solutions" && (
            <SolutionsMenu onClose={() => setActiveCategory(null)} />
          )}
          {activeCategory === "how-it-works" && (
            <HowItWorksMenu onClose={() => setActiveCategory(null)} />
          )}
          {activeCategory === "integrations" && (
            <IntegrationsMenu onClose={() => setActiveCategory(null)} />
          )}
          {activeCategory === "security" && (
            <SecurityMenu onClose={() => setActiveCategory(null)} />
          )}
        </div>
      )}

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="absolute left-0 right-0 top-full z-50 mt-2 max-h-[85vh] overflow-y-auto rounded-2xl border border-border bg-background p-4 shadow-2xl md:hidden">
          <div className="flex flex-col gap-2">
            {NAV_CATEGORIES.map((category) => {
              const isExpanded = mobileExpanded === category.id;
              return (
                <div key={category.id} className="border-b border-border/50 pb-2">
                  <button
                    type="button"
                    onClick={() =>
                      setMobileExpanded(isExpanded ? null : category.id)
                    }
                    className="flex w-full items-center justify-between py-2 text-sm font-semibold text-text-primary"
                  >
                    <span>{category.label}</span>
                    <ChevronDown
                      className={`size-4 transition-transform ${
                        isExpanded ? "rotate-180 text-brand" : "text-text-secondary"
                      }`}
                    />
                  </button>
                  {isExpanded && (
                    <div className="pt-2">
                      {category.id === "platform" && (
                        <PlatformMenu onClose={() => setMobileOpen(false)} />
                      )}
                      {category.id === "solutions" && (
                        <SolutionsMenu onClose={() => setMobileOpen(false)} />
                      )}
                      {category.id === "how-it-works" && (
                        <HowItWorksMenu onClose={() => setMobileOpen(false)} />
                      )}
                      {category.id === "integrations" && (
                        <IntegrationsMenu onClose={() => setMobileOpen(false)} />
                      )}
                      {category.id === "security" && (
                        <SecurityMenu onClose={() => setMobileOpen(false)} />
                      )}
                    </div>
                  )}
                </div>
              );
            })}

            <Link
              href="/pricing"
              onClick={() => setMobileOpen(false)}
              className="py-2.5 text-sm font-semibold text-text-primary"
            >
              Pricing
            </Link>
            <Link
              href="/docs"
              onClick={() => setMobileOpen(false)}
              className="py-2.5 text-sm font-semibold text-text-primary"
            >
              Documentation & API
            </Link>

            <div className="mt-4 flex flex-col gap-2 pt-2 border-t border-border">
              <LinkButton
                href="/sign-in"
                variant="outline"
                className="w-full justify-center"
                onClick={() => setMobileOpen(false)}
              >
                Sign in
              </LinkButton>
              <LinkButton
                href="/sign-up"
                className="w-full justify-center"
                onClick={() => setMobileOpen(false)}
              >
                Get started
              </LinkButton>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
