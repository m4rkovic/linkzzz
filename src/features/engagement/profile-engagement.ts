import { isLinkNavigable, resolveLinkAvailability } from "@/features/links/link-availability";
import { resolveScheduleWindow, type ScheduleWindowState } from "@/features/scheduling/schedule";
import type { ProfileEngagement, PublicProfileData, PublicProfileLink } from "@/types/profile";

export type CampaignRuntimeState = "OFF" | ScheduleWindowState;

export function resolveCampaignState(
  engagement: ProfileEngagement | null | undefined,
  nowMs: number = Date.now(),
): CampaignRuntimeState {
  const campaign = engagement?.campaign;
  if (!campaign?.enabled || !campaign.primaryLinkId) return "OFF";
  return resolveScheduleWindow(campaign, nowMs);
}

export function hasCampaignSchedule(engagement: ProfileEngagement | null | undefined) {
  const campaign = engagement?.campaign;
  return Boolean(campaign?.enabled && (campaign.visibleFrom || campaign.visibleUntil));
}

export function resolveActiveCampaignLink(
  profile: PublicProfileData,
  nowMs: number = Date.now(),
): PublicProfileLink | null {
  const campaign = profile.engagement?.campaign;
  if (!campaign?.enabled || !campaign.primaryLinkId) return null;
  if (resolveCampaignState(profile.engagement, nowMs) !== "ACTIVE") return null;

  const link = profile.links.find((item) => item.id === campaign.primaryLinkId);
  if (!link?.visible) return null;
  if (!isLinkNavigable(resolveLinkAvailability(link, nowMs))) return null;
  return link;
}

export function resolvePinnedLinkId(
  profile: PublicProfileData,
  nowMs: number = Date.now(),
) {
  const campaign = profile.engagement?.campaign;
  const campaignLink = resolveActiveCampaignLink(profile, nowMs);
  if (campaignLink && (campaign?.pinPrimary ?? true)) return campaignLink.id;

  const featuredId = profile.engagement?.featuredLinkId;
  if (!featuredId) return undefined;
  const featured = profile.links.find((link) => link.id === featuredId);
  if (!featured?.visible) return undefined;
  if (!isLinkNavigable(resolveLinkAvailability(featured, nowMs))) return undefined;
  return featured.id;
}

export function pinLinkFirst<T extends { link: PublicProfileLink }>(items: T[], linkId?: string) {
  if (!linkId) return items;
  const index = items.findIndex((item) => item.link.id === linkId);
  if (index <= 0) return items;
  return [items[index], ...items.slice(0, index), ...items.slice(index + 1)];
}

export function sanitizeEngagementForLinks(
  engagement: ProfileEngagement | undefined,
  links: PublicProfileLink[],
): ProfileEngagement | undefined {
  if (!engagement) return undefined;
  const ids = new Set(links.map((link) => link.id));
  const featuredLinkId = engagement.featuredLinkId && ids.has(engagement.featuredLinkId)
    ? engagement.featuredLinkId
    : undefined;
  const primaryLinkId =
    engagement.campaign?.primaryLinkId && ids.has(engagement.campaign.primaryLinkId)
      ? engagement.campaign.primaryLinkId
      : undefined;
  const campaign = engagement.campaign
    ? {
        ...engagement.campaign,
        primaryLinkId,
        enabled: primaryLinkId ? engagement.campaign.enabled : false,
      }
    : undefined;
  const visitorMessaging = engagement.visitorMessaging
    ? { ...engagement.visitorMessaging }
    : undefined;

  if (!featuredLinkId && !campaign && !visitorMessaging) return undefined;
  return { featuredLinkId, campaign, visitorMessaging };
}
