/** The Avenra symbol and wordmark (Guidelines §144.4). */
export function BrandLogo({ markOnly = false, className = "size-8" }: { markOnly?: boolean; className?: string }) {
  // eslint-disable-next-line @next/next/no-img-element -- the CSP blocks next/image's inline style
  const mark = <img src="/avenra-symbol.png" alt={markOnly ? "Avenra" : ""} width={32} height={32} className={`rounded-lg ${className}`} />;
  if (markOnly) {
    return mark;
  }
  return (
    <span className="inline-flex items-center gap-2.5">
      {mark}
      <span className="text-[19px] font-semibold tracking-tight text-text-primary">Avenra</span>
    </span>
  );
}
