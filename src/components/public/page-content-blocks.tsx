"use client";

import { useState, type CSSProperties, type FormEvent } from "react";
import { ArrowUpRight, Check, Mail } from "lucide-react";

import UserContentImage from "@/components/ui/user-content-image";
import { resolveScheduleWindow } from "@/features/scheduling/schedule";
import type { PageContentBlock, PublicProfileData } from "@/types/profile";

export default function PageContentBlocks({
  profile,
  isPreview,
  nowMs,
}: {
  profile: PublicProfileData;
  isPreview: boolean;
  nowMs: number;
}) {
  const blocks = profile.contentBlocks.filter(
    (block) => block.visible && resolveScheduleWindow(block, nowMs) === "ACTIVE",
  );
  if (!blocks.length) return null;

  return (
    <div className="linkzzz-block-stack">
      {blocks.map((block) => (
        <PageContentBlockView
          key={block.id}
          block={block}
          profile={profile}
          isPreview={isPreview}
          nowMs={nowMs}
        />
      ))}
    </div>
  );
}

function PageContentBlockView({
  block,
  profile,
  isPreview,
  nowMs,
}: {
  block: PageContentBlock;
  profile: PublicProfileData;
  isPreview: boolean;
  nowMs: number;
}) {
  const primary = profile.appearance.primaryTextColor;
  const secondary = profile.appearance.secondaryTextColor;
  const radius = profile.appearance.cards?.borderRadius ?? profile.appearance.borderRadius ?? 18;
  const page = profile.appearance.page;
  const surfaceOpacity = Math.max(0, Math.min(1, page?.sectionSurfaceOpacity ?? 0.08));
  const surface = colorWithAlpha(page?.sectionBackgroundColor ?? primary, surfaceOpacity);
  const border = colorWithAlpha(page?.sectionBorderColor ?? primary, Math.max(0.08, Math.min(1, surfaceOpacity * 1.6)));

  if (block.type === "SPACER") {
    return <div aria-hidden="true" style={{ height: `${isPreview ? Math.min(block.height, 80) : block.height}px` }} />;
  }

  if (block.type === "DIVIDER") {
    return (
      <div className="py-2" aria-hidden="true">
        <div
          style={{
            height: `${block.thickness}px`,
            background: block.style === "faded"
              ? `linear-gradient(90deg, transparent, ${colorWithAlpha(primary, 0.26)}, transparent)`
              : colorWithAlpha(primary, 0.18),
          }}
        />
      </div>
    );
  }

  if (block.type === "TEXT") {
    return (
      <section
        className={block.surface === "card" ? "border px-5 py-5 sm:px-6" : "px-1 py-2"}
        style={block.surface === "card" ? { borderColor: border, backgroundColor: surface, borderRadius: radius } : undefined}
      >
        <div className={block.alignment === "center" ? "text-center" : "text-left"}>
          {block.heading && <h2 className="text-lg font-black tracking-tight sm:text-xl">{block.heading}</h2>}
          <p className={`${block.heading ? "mt-2" : ""} whitespace-pre-wrap text-sm leading-6`} style={{ color: secondary }}>{block.body}</p>
        </div>
      </section>
    );
  }

  if (block.type === "COUNTDOWN") {
    const targetMs = Date.parse(block.targetAt);
    const remainingMs = nowMs > 0 && Number.isFinite(targetMs) ? Math.max(0, targetMs - nowMs) : null;
    const complete = remainingMs === 0;
    const units = remainingMs === null ? null : countdownUnits(remainingMs);
    const surfaceStyle = block.surface === "card"
      ? { borderColor: border, backgroundColor: surface, borderRadius: radius }
      : undefined;

    return (
      <section
        className={`${block.surface === "card" ? "border px-5 py-5 sm:px-6" : "px-1 py-2"} ${block.alignment === "center" ? "text-center" : "text-left"}`}
        style={surfaceStyle}
      >
        <h2 className="text-lg font-black tracking-tight sm:text-xl">{block.title}</h2>
        {complete ? (
          <p className="mt-3 text-sm font-black" style={{ color: secondary }}>{block.completionText}</p>
        ) : (
          <div className={`mt-4 grid grid-cols-4 gap-2 ${block.alignment === "center" ? "mx-auto" : ""}`}>
            {([
              ["Days", units?.days],
              ["Hours", units?.hours],
              ["Min", units?.minutes],
              ["Sec", units?.seconds],
            ] as const).map(([label, value]) => (
              <div
                key={label}
                className="rounded-xl border px-2 py-3"
                style={{ borderColor: border, backgroundColor: colorWithAlpha(primary, 0.045) }}
              >
                <div className="text-lg font-black tabular-nums sm:text-2xl">{value === undefined ? "–" : String(value).padStart(2, "0")}</div>
                <div className="mt-0.5 text-[9px] font-bold uppercase tracking-[0.12em]" style={{ color: secondary }}>{label}</div>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  }

  if (block.type === "CTA") {
    const buttonStyle = ctaButtonStyle(block.style, profile);
    return (
      <section
        className={`border px-5 py-5 sm:px-6 ${block.alignment === "center" ? "text-center" : "text-left"}`}
        style={{ borderColor: border, backgroundColor: surface, borderRadius: radius }}
      >
        <h2 className="text-lg font-black tracking-tight sm:text-xl">{block.title}</h2>
        {block.description && <p className="mt-1.5 text-sm leading-6" style={{ color: secondary }}>{block.description}</p>}
        <a
          href={isPreview ? undefined : block.url}
          target={isPreview ? undefined : "_blank"}
          rel={isPreview ? undefined : "noopener noreferrer"}
          onClick={isPreview ? (event) => event.preventDefault() : undefined}
          className="mt-4 inline-flex min-h-11 items-center justify-center gap-2 rounded-full px-5 text-sm font-black transition hover:-translate-y-0.5"
          style={buttonStyle}
        >
          {block.buttonText} <ArrowUpRight size={15} />
        </a>
      </section>
    );
  }

  if (block.type === "EMAIL_CAPTURE") {
    return <EmailCaptureBlock block={block} profile={profile} isPreview={isPreview} />;
  }

  if (block.type === "GALLERY") {
    const ratioClass = block.aspectRatio === "portrait" ? "aspect-[3/4]" : block.aspectRatio === "landscape" ? "aspect-[4/3]" : "aspect-square";
    const columns = block.columns === 2 ? "grid-cols-2" : block.columns === 4 ? "grid-cols-4" : "grid-cols-3";
    return (
      <section className="py-1">
        {block.title && <h2 className="mb-3 text-base font-black tracking-tight">{block.title}</h2>}
        <div className={`grid ${columns} gap-2`}>
          {block.images.filter((image) => image.imageUrl).map((image) => (
            <div key={image.id} className={`relative overflow-hidden ${ratioClass}`} style={{ borderRadius: Math.max(10, radius - 5) }}>
              <UserContentImage
                src={image.imageUrl!}
                alt={image.alt ?? "Gallery image"}
                className="absolute inset-0 h-full w-full object-cover transition duration-300 hover:scale-[1.025]"
              />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (block.type === "EMBED") {
    const embedUrl = getSafeEmbedUrl(block.url);
    return (
      <section className="overflow-hidden border" style={{ borderColor: border, backgroundColor: surface, borderRadius: radius }}>
        {block.title && <h2 className="px-4 pb-2 pt-4 text-base font-black tracking-tight sm:px-5">{block.title}</h2>}
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={block.title || "Embedded media"}
            className="block aspect-video w-full border-0"
            loading="lazy"
            allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture"
            sandbox="allow-scripts allow-same-origin allow-presentation allow-popups"
          />
        ) : (
          <a
            href={isPreview ? undefined : block.url}
            target={isPreview ? undefined : "_blank"}
            rel={isPreview ? undefined : "noopener noreferrer"}
            onClick={isPreview ? (event) => event.preventDefault() : undefined}
            className="flex min-h-20 items-center justify-between gap-4 px-4 py-4 sm:px-5"
          >
            <span className="text-sm font-bold">Open media</span>
            <ArrowUpRight size={17} />
          </a>
        )}
      </section>
    );
  }

  return null;
}

function EmailCaptureBlock({
  block,
  profile,
  isPreview,
}: {
  block: Extract<PageContentBlock, { type: "EMAIL_CAPTURE" }>;
  profile: PublicProfileData;
  isPreview: boolean;
}) {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "done" | "error">("idle");
  const radius = profile.appearance.cards?.borderRadius ?? profile.appearance.borderRadius ?? 18;
  const primary = profile.appearance.primaryTextColor;
  const secondary = profile.appearance.secondaryTextColor;
  const page = profile.appearance.page;
  const surfaceOpacity = Math.max(0, Math.min(1, page?.sectionSurfaceOpacity ?? 0.08));
  const surface = colorWithAlpha(page?.sectionBackgroundColor ?? primary, surfaceOpacity);
  const border = colorWithAlpha(page?.sectionBorderColor ?? primary, Math.max(0.08, Math.min(1, surfaceOpacity * 1.6)));

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (isPreview) {
      setState("done");
      return;
    }
    setState("sending");
    try {
      const response = await fetch(`/api/public/smart-links/${encodeURIComponent(profile.slug)}/leads`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ blockId: block.id, email }),
      });
      if (!response.ok) throw new Error("submit failed");
      setState("done");
      setEmail("");
    } catch {
      setState("error");
    }
  }

  return (
    <section className="border px-4 py-4 sm:px-5" style={{ borderColor: border, backgroundColor: surface, borderRadius: radius }}>
      <div className="flex items-start gap-3">
        <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ backgroundColor: colorWithAlpha(primary, 0.1) }}><Mail size={16} /></div>
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-black tracking-tight">{block.title}</h2>
          {block.description && <p className="mt-1 text-xs leading-5" style={{ color: secondary }}>{block.description}</p>}
        </div>
      </div>

      {state === "done" ? (
        <div className="mt-4 flex min-h-11 items-center gap-2 rounded-full px-4 text-sm font-bold" style={{ backgroundColor: colorWithAlpha(primary, 0.1) }}><Check size={16} /> {block.successMessage}</div>
      ) : (
        <form onSubmit={submit} className="mt-4 flex min-w-0 gap-2">
          <input
            type="email"
            required
            maxLength={254}
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder={block.placeholder}
            className="min-h-11 min-w-0 flex-1 rounded-full border px-4 text-sm text-zinc-950 outline-none placeholder:text-zinc-400"
            style={{ borderColor: colorWithAlpha(primary, 0.2), backgroundColor: "#ffffff" }}
          />
          <button type="submit" disabled={state === "sending"} className="min-h-11 shrink-0 rounded-full px-4 text-sm font-black disabled:opacity-50" style={{ backgroundColor: primary, color: contrastText(primary) }}>{state === "sending" ? "…" : block.buttonText}</button>
        </form>
      )}
      {state === "error" && <p className="mt-2 text-xs font-bold text-red-500">Could not submit. Try again.</p>}
    </section>
  );
}

function countdownUnits(remainingMs: number) {
  const totalSeconds = Math.max(0, Math.floor(remainingMs / 1_000));
  const days = Math.floor(totalSeconds / 86_400);
  const hours = Math.floor((totalSeconds % 86_400) / 3_600);
  const minutes = Math.floor((totalSeconds % 3_600) / 60);
  const seconds = totalSeconds % 60;
  return { days, hours, minutes, seconds };
}

function ctaButtonStyle(style: "solid" | "outline" | "glass", profile: PublicProfileData): CSSProperties {
  const primary = profile.appearance.primaryTextColor;
  if (style === "outline") return { border: `1px solid ${colorWithAlpha(primary, 0.42)}`, color: primary, backgroundColor: "transparent" };
  if (style === "glass") return { border: `1px solid ${colorWithAlpha(primary, 0.12)}`, color: primary, backgroundColor: colorWithAlpha(primary, 0.08), backdropFilter: "blur(18px)" };
  return { backgroundColor: primary, color: contrastText(primary) };
}

function getSafeEmbedUrl(raw: string) {
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase().replace(/^www\./, "");
    if (host === "youtu.be") {
      const id = url.pathname.split("/").filter(Boolean)[0];
      return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null;
    }
    if (host === "youtube.com" || host === "m.youtube.com") {
      const id = url.pathname.startsWith("/shorts/")
        ? url.pathname.split("/").filter(Boolean)[1]
        : url.searchParams.get("v");
      return id ? `https://www.youtube-nocookie.com/embed/${encodeURIComponent(id)}` : null;
    }
    if (host === "open.spotify.com") {
      const parts = url.pathname.split("/").filter(Boolean);
      if (parts.length >= 2 && ["track", "album", "playlist", "artist", "episode", "show"].includes(parts[0])) {
        return `https://open.spotify.com/embed/${parts[0]}/${encodeURIComponent(parts[1])}`;
      }
    }
  } catch {
    return null;
  }
  return null;
}

function colorWithAlpha(hex: string, alpha: number) {
  const normalized = hex.trim();
  if (!/^#[0-9a-f]{6}$/i.test(normalized)) return `rgba(255,255,255,${alpha})`;
  const r = Number.parseInt(normalized.slice(1, 3), 16);
  const g = Number.parseInt(normalized.slice(3, 5), 16);
  const b = Number.parseInt(normalized.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function contrastText(hex: string) {
  if (!/^#[0-9a-f]{6}$/i.test(hex)) return "#000000";
  const r = Number.parseInt(hex.slice(1, 3), 16);
  const g = Number.parseInt(hex.slice(3, 5), 16);
  const b = Number.parseInt(hex.slice(5, 7), 16);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? "#111111" : "#ffffff";
}
