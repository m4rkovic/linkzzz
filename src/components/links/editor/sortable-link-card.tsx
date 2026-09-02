import type { Dispatch, SetStateAction } from "react";
import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { CalendarClock, Eye, EyeOff, Globe2, GripVertical, Pencil, ShieldAlert, Sparkles, Trash2 } from "lucide-react";
import type { PublicProfileLink } from "@/types/profile";
import type { LinkDraft } from "@/features/links/link-editor-types";
import { capitalize } from "@/features/links/link-editor-model";
import { resolveLinkAvailability } from "@/features/links/link-availability";
import { getPlatformName, PlatformIcon } from "@/config/platforms";
import UserContentImage from "@/components/ui/user-content-image";
import { ActionButton, StatusBadge } from "./link-editor-primitives";
import LinkEditorForm from "./link-editor-form";

export default function SortableLinkCard({
  link,
  editing,
  draft,
  setDraft,
  error,
  onEdit,
  onSave,
  onCancel,
  onToggle,
  onDelete,
  featured = false,
  campaignPrimary = false,
}: {
  link: PublicProfileLink;
  editing: boolean;
  draft: LinkDraft;
  setDraft: Dispatch<SetStateAction<LinkDraft>>;
  error: string;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  onToggle: () => void;
  onDelete: () => void;
  featured?: boolean;
  campaignPrimary?: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: link.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.55 : 1,
  };
  const availabilityState = resolveLinkAvailability(link);

  return (
    <article
      ref={setNodeRef}
      style={style}
      className={`w-full min-w-0 overflow-hidden rounded-2xl border bg-white ${
        editing ? "border-zinc-950 p-4 sm:p-6" : "border-zinc-200 p-3 sm:p-4"
      }`}
    >
      {editing ? (
        <LinkEditorForm
          draft={draft}
          setDraft={setDraft}
          error={error}
          onSave={onSave}
          onCancel={onCancel}
          protectedImageUrl={link.imageUrl}
        />
      ) : (
        <div className="grid min-w-0 grid-cols-[36px_minmax(0,1fr)] items-start gap-2 sm:grid-cols-[40px_48px_minmax(0,1fr)_auto] sm:gap-3">
          <button
            type="button"
            {...attributes}
            {...listeners}
            aria-label="Reorder link"
            className="flex h-11 w-9 shrink-0 cursor-grab items-center justify-center rounded-xl text-zinc-400 transition hover:bg-zinc-100 active:cursor-grabbing sm:w-10"
          >
            <GripVertical size={19} />
          </button>

          <div className="hidden h-12 w-12 shrink-0 overflow-hidden rounded-xl bg-zinc-100 sm:flex sm:items-center sm:justify-center">
            {link.imageUrl ? (
              <UserContentImage src={link.imageUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <PlatformIcon
                platform={link.platform ?? "custom"}
                size={18}
                className="text-zinc-500"
              />
            )}
          </div>

          <div className="min-w-0 py-0.5">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <p className="min-w-0 max-w-full truncate text-sm font-semibold text-zinc-900">
                {link.title}
              </p>
              {!link.visible && <StatusBadge>Hidden</StatusBadge>}
              {featured && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-lime-soft px-2 py-1 text-[10px] font-semibold text-zinc-800">
                  Featured
                </span>
              )}
              {campaignPrimary && (
                <span className="inline-flex items-center gap-1 rounded-full bg-brand-violet-soft px-2 py-1 text-[10px] font-semibold text-brand-violet-strong">
                  <Sparkles size={10} /> Campaign primary
                </span>
              )}
              {availabilityState === "UPCOMING" && <StatusBadge>Scheduled</StatusBadge>}
              {availabilityState === "EXPIRED_HIDDEN" && <StatusBadge>Expired · hidden</StatusBadge>}
              {availabilityState === "EXPIRED_DISABLED" && <StatusBadge>Expired · disabled</StatusBadge>}
            </div>

            <p className="mt-1 max-w-full truncate text-xs text-zinc-400">
              {link.url}
            </p>

            <div className="mt-2 flex flex-wrap gap-1.5">
              <StatusBadge>{getPlatformName(link.platform ?? "custom")}</StatusBadge>
              <StatusBadge>{capitalize(link.layout ?? "button")}</StatusBadge>
              {link.imageUrl && <StatusBadge>Image</StatusBadge>}
              {link.customStyle?.enabled && (
                <span className="rounded-full bg-violet-50 px-2 py-1 text-[10px] font-semibold text-violet-700">Custom design</span>
              )}
              {link.customStyle?.focusEffect && link.customStyle.focusEffect !== "none" && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-700">
                  <Sparkles size={10} /> Highlighted
                </span>
              )}
              {link.customStyle?.badgeText && (
                <span className="rounded-full bg-emerald-50 px-2 py-1 text-[10px] font-semibold text-emerald-700">Badge: {link.customStyle.badgeText}</span>
              )}
              {link.customStyle?.ctaStyle && link.customStyle.ctaStyle !== "none" && (
                <span className="rounded-full bg-sky-50 px-2 py-1 text-[10px] font-semibold text-sky-700">CTA</span>
              )}
              {(link.availability?.visibleFrom || link.availability?.visibleUntil) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-violet-50 px-2 py-1 text-[10px] font-semibold text-violet-700">
                  <CalendarClock size={11} /> Timed
                </span>
              )}
              {link.sensitiveContent?.enabled && (
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2 py-1 text-[10px] font-semibold text-amber-800">
                  <ShieldAlert size={11} /> Sensitive
                </span>
              )}
              {(link.geo?.enabled || (link.geoDestinations?.length ?? 0) > 0) && (
                <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-[10px] font-semibold text-blue-700">
                  <Globe2 size={11} />
                  {link.geo?.enabled ? link.geo.rules.length : link.geoDestinations.length} geo
                </span>
              )}
            </div>
          </div>

          <div className="col-span-2 flex justify-end sm:col-span-1 sm:col-start-4 sm:row-start-1">
            <ActionButton label={link.visible ? "Hide" : "Show"} onClick={onToggle}>
              {link.visible ? <Eye size={17} /> : <EyeOff size={17} />}
            </ActionButton>
            <ActionButton label="Edit" onClick={onEdit}>
              <Pencil size={16} />
            </ActionButton>
            <ActionButton label="Delete" danger onClick={onDelete}>
              <Trash2 size={16} />
            </ActionButton>
          </div>
        </div>
      )}
    </article>
  );
}
