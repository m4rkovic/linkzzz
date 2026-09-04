import Link from "next/link";

export type LinkzzzBrandTone = "dark" | "light";

export default function LinkzzzBrand({
  href,
  tone = "dark",
  compact = false,
  className = "",
}: {
  href?: string;
  tone?: LinkzzzBrandTone;
  compact?: boolean;
  className?: string;
}) {
  const content = (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <span
        aria-hidden="true"
        className="inline-flex h-5 w-6 -rotate-[8deg] items-end gap-[2px]"
      >
        <span className="h-[11px] w-1.5 rounded-full bg-brand-lime" />
        <span className="h-[19px] w-1.5 rounded-full bg-brand-lime" />
        <span className="h-[15px] w-1.5 rounded-full bg-brand-lime" />
      </span>
      {!compact && (
        <span
          className={`text-[15px] font-black tracking-[0.08em] ${
            tone === "light" ? "text-white" : "text-zinc-950"
          }`}
        >
          LINKZZZ
        </span>
      )}
    </span>
  );

  if (!href) return content;

  return (
    <Link href={href} aria-label="Linkzzz home" className="inline-flex shrink-0">
      {content}
    </Link>
  );
}
