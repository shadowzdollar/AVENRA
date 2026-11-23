'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface AvenraIconProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, 'width' | 'height'> {
  size?: number | string;
  className?: string;
}

/**
 * Avenra brand mark rendered from the official transparent logo asset.
 */
export function AvenraIcon({ size = 32, className, alt = 'Avenra', ...props }: AvenraIconProps) {
  const numericSize = typeof size === 'number' ? size : Number.parseInt(size, 10) || 32;

  return (
    <img
      src='/logo.png'
      alt={alt}
      width={numericSize}
      height={numericSize}
      className={cn(
        'shrink-0 object-contain transition-transform duration-300 hover:scale-105',
        className
      )}
      {...props}
    />
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
