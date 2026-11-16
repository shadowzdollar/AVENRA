'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface AvenraIconProps extends React.SVGProps<SVGSVGElement> {
  size?: number | string;
  className?: string;
}

/**
 * Avenra Distinctive Geometric Nexus Mark.
 * Symbolizes continuous autonomous execution, precision verification,
 * and immutable cryptographic audit trails without relying on a generic "A" lettermark.
 */
export function AvenraIcon({ size = 32, className, ...props }: AvenraIconProps) {
  const id = React.useId();
  const gradPrimary = `avenra-nexus-primary-${id}`;
  const gradSecondary = `avenra-nexus-secondary-${id}`;
  const gradGlow = `avenra-nexus-glow-${id}`;

  return (
    <svg
      width={size}
      height={size}
      viewBox='0 0 48 48'
      fill='none'
      xmlns='http://www.w3.org/2000/svg'
      className={cn('shrink-0 transition-transform duration-300 hover:scale-105', className)}
      {...props}
    >
      <defs>
        {/* Dynamic Indigo to Cyan Gradient */}
        <linearGradient id={gradPrimary} x1='4' y1='8' x2='44' y2='40' gradientUnits='userSpaceOnUse'>
          <stop offset='0%' stopColor='#4F46E5' />
          <stop offset='50%' stopColor='#2563EB' />
          <stop offset='100%' stopColor='#06B6D4' />
        </linearGradient>

        {/* Counter Facet Violet to Electric Blue */}
        <linearGradient id={gradSecondary} x1='44' y1='10' x2='6' y2='38' gradientUnits='userSpaceOnUse'>
          <stop offset='0%' stopColor='#9333EA' />
          <stop offset='60%' stopColor='#3B82F6' />
          <stop offset='100%' stopColor='#0EA5E9' />
        </linearGradient>

        {/* Ambient Core Glow */}
        <radialGradient id={gradGlow} cx='50%' cy='50%' r='50%'>
          <stop offset='0%' stopColor='#38BDF8' stopOpacity='0.45' />
          <stop offset='100%' stopColor='#38BDF8' stopOpacity='0' />
        </radialGradient>
      </defs>

      {/* Core Energy Halo */}
      <circle cx='24' cy='24' r='18' fill={`url(#${gradGlow})`} />

      {/* Upper Kinetic Prism Facet (Forward Flow) */}
      <path
        d='M24 4L42 16L34 22L24 14L14 22L6 16L24 4Z'
        fill={`url(#${gradPrimary})`}
        fillOpacity='0.95'
      />

      {/* Right Interlocking Wing (Verification Loop) */}
      <path
        d='M42 16L42 32L34 38L34 22L42 16Z'
        fill={`url(#${gradSecondary})`}
        fillOpacity='0.9'
      />

      {/* Lower Foundation Prism (Continuous Ledger) */}
      <path
        d='M24 44L6 32L14 26L24 34L34 26L42 32L24 44Z'
        fill={`url(#${gradPrimary})`}
        fillOpacity='0.85'
      />

      {/* Left Interlocking Wing */}
      <path
        d='M6 16L6 32L14 26L14 22L6 16Z'
        fill={`url(#${gradSecondary})`}
        fillOpacity='0.9'
      />

      {/* Central Precision Diamond (Deterministic Vertex) */}
      <polygon
        points='24,17 31,24 24,31 17,24'
        fill='#ffffff'
        className='dark:fill-slate-900 fill-white drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]'
      />
      <polygon
        points='24,19 29,24 24,29 19,24'
        fill={`url(#${gradSecondary})`}
      />
      <circle cx='24' cy='24' r='2' fill='#38BDF8' />
    </svg>
  );
}

interface AvenraWordmarkProps {
  className?: string;
  showSubtitle?: boolean;
  subtitleText?: string;
}

export function AvenraWordmark({
  className,
  showSubtitle = false,
  subtitleText = 'AUTONOMOUS WORK ENGINE'
}: AvenraWordmarkProps) {
  return (
    <div className={cn('flex flex-col select-none leading-none', className)}>
      <div className='flex items-center gap-1.5'>
        <span className='font-black tracking-wider text-base md:text-lg bg-gradient-to-r from-foreground via-foreground/90 to-foreground/80 bg-clip-text text-transparent'>
          AVENRA
        </span>
        <span className='size-1.5 rounded-full bg-cyan-500 animate-pulse' />
      </div>
      {showSubtitle && (
        <span className='text-[9px] font-semibold tracking-widest text-muted-foreground/80 uppercase mt-0.5'>
          {subtitleText}
        </span>
      )}
    </div>
  );
}

interface AvenraLogoProps {
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
  subtitleText?: string;
  className?: string;
  collapsed?: boolean;
}

export function AvenraLogo({
  size = 'md',
  showSubtitle = false,
  subtitleText,
  className,
  collapsed = false
}: AvenraLogoProps) {
  const iconSize = size === 'sm' ? 24 : size === 'lg' ? 40 : 32;

  return (
    <div className={cn('flex items-center gap-2.5', className)}>
      <AvenraIcon size={iconSize} />
      {!collapsed && (
        <AvenraWordmark showSubtitle={showSubtitle} subtitleText={subtitleText} />
      )}
    </div>
  );
}
