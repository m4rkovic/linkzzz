import type { CSSProperties } from "react";
import { MapPin } from "lucide-react";

import PageBackgroundEffects from "@/components/public/page-background-effects";
import PublicProfileContentRuntime from "@/components/public/public-profile-content-runtime";
import PublicProfileLinkRuntime from "@/components/public/public-profile-link-runtime";
import PublicProfileShareButton from "@/components/public/public-profile-share";
import PublicSocialTracking from "@/components/public/public-social-tracking";
import PublicVisualStickyHeader from "@/components/public/public-visual-sticky-header";
import SmartLinkTracking from "@/components/public/smart-link-tracking";
import {
  addAlpha,
  getAvatarRadius,
  getInitials,
  getPageBackground,
  getPageStyleVariables,
  getSocialRadius,
} from "@/components/public/profile-renderer-utils";
import { resolveVisualProfileLayout } from "@/components/public/visual-profile-layout";
import { VisualProfileHero } from "@/components/public/visual-profile-hero";
import UserContentImage from "@/components/ui/user-content-image";
import { PlatformIcon } from "@/config/platforms";
import { hydrateProfile } from "@/features/profile/profile-serialization";
import {
  resolveResponseTimeLabel,
  resolveVisitorMessaging,
} from "@/features/engagement/visitor-messaging";
import type { PersistedProfileData } from "@/types/persisted-profile";
import type { PublicProfileData } from "@/types/profile";
import type { TrackingConfig } from "@/types/smart-link";

export default function PublicProfileServer({
  initialProfile,
  tracking,
  initialNowMs,
}: {
  initialProfile: PersistedProfileData;
  tracking: TrackingConfig;
  initialNowMs: number;
}) {
  const profile = hydrateProfile(initialProfile);
  if (profile.status !== "PUBLISHED") return <UnavailableProfile />;

  return (
    <>
      <SmartLinkTracking tracking={tracking} />
      <PublicSocialTracking tracking={tracking} />
      {(profile.appearance.layoutMode ?? "classic") === "visual" ? (
        <PublicVisualProfile
          profile={profile}
          tracking={tracking}
          initialNowMs={initialNowMs}
        />
      ) : (
        <PublicClassicProfile
          profile={profile}
          tracking={tracking}
          initialNowMs={initialNowMs}
        />
      )}
    </>
  );
}

function PublicClassicProfile({
  profile,
  tracking,
  initialNowMs,
}: {
  profile: PublicProfileData;
  tracking: TrackingConfig;
  initialNowMs: number;
}) {
  const appearance = profile.appearance;
  const page = appearance.page;
  const maxWidth = page?.maxWidth ?? 760;
  const verticalPadding = page?.verticalPadding ?? 28;

  return (
    <div
      className="linkzzz-public-page relative min-h-screen w-full overflow-hidden"
      style={{
        ...getPageStyleVariables(profile),
        background: getPageBackground(profile),
        color: appearance.primaryTextColor,
        fontFamily: appearance.fontFamily,
      }}
    >
      <PageBackgroundEffects profile={profile} />
      <div className="linkzzz-page-horizontal relative mx-auto flex min-h-screen w-full max-w-6xl flex-col py-5 sm:py-6 lg:py-10">
        <PublicTopBar profile={profile} visual={false} />

        <div
          className="mx-auto flex w-full flex-1 flex-col justify-center"
          style={{
            maxWidth: `${maxWidth}px`,
            paddingTop: `${verticalPadding}px`,
            paddingBottom: `${verticalPadding}px`,
          }}
        >
          <header className="text-center">
            <div className="flex justify-center">
              <PublicProfileAvatar
                profile={profile}
                size={108}
                radius="50%"
                elevated
              />
            </div>
            <h1 className="mt-5 text-2xl font-black tracking-tight sm:text-3xl">
              {profile.displayName}
            </h1>
            {profile.bio ? (
              <p
                className="mx-auto mt-3 max-w-md text-sm leading-6 sm:text-base"
                style={{ color: appearance.secondaryTextColor }}
              >
                {profile.bio}
              </p>
            ) : null}
            {profile.locationLabel ? (
              <div
                className="mt-4 flex items-center justify-center gap-2 text-xs"
                style={{ color: appearance.secondaryTextColor }}
              >
                <MapPin size={13} />
                {profile.locationLabel}
              </div>
            ) : null}
            <PublicVisitorSignals profile={profile} />
          </header>

          <PublicSocialLinks profile={profile} mode="classic" />
          <PublicProfileLinkRuntime
            profile={profile}
            layout="classic"
            tracking={tracking}
            initialNowMs={initialNowMs}
          />
        </div>

        {profile.contentBlocks.length > 0 ? (
          <div
            className="linkzzz-section-gap-top mx-auto w-full"
            style={{ maxWidth: `${maxWidth}px` }}
          >
            <PublicProfileContentRuntime
              profile={profile}
              initialNowMs={initialNowMs}
            />
          </div>
        ) : null}

        <PublicFooter profile={profile} />
      </div>
    </div>
  );
}

function PublicVisualProfile({
  profile,
  tracking,
  initialNowMs,
}: {
  profile: PublicProfileData;
  tracking: TrackingConfig;
  initialNowMs: number;
}) {
  const appearance = profile.appearance;
  const {
    maxWidth,
    heroEnabled,
    identityInsideHero,
    identityAlignment,
    showAvatar,
    showName,
    showUsername,
    showBio,
    showLocation,
    showSocials,
    showStats,
    heroPrimary,
    heroSecondary,
    verticalPadding,
    heroAvatarOverlap,
  } = resolveVisualProfileLayout(profile);
  const identityId = `linkzzz-public-identity-${profile.slug}`;

  const identity = (
    <PublicVisualIdentityGroup
      profile={profile}
      heroEnabled={heroEnabled}
      alignment={identityAlignment}
      primaryColor={identityInsideHero ? heroPrimary : appearance.primaryTextColor}
      secondaryColor={identityInsideHero ? heroSecondary : appearance.secondaryTextColor}
      showAvatar={showAvatar}
      showName={showName}
      showUsername={showUsername}
      showBio={showBio}
      showLocation={showLocation}
      showSocials={showSocials}
      showStats={showStats}
    />
  );

  return (
    <div
      className="linkzzz-public-page relative min-h-screen w-full overflow-hidden"
      style={{
        ...getPageStyleVariables(profile),
        background: getPageBackground(profile),
        color: appearance.primaryTextColor,
        fontFamily: appearance.fontFamily,
      }}
    >
      <PageBackgroundEffects profile={profile} />
      <div className="relative mx-auto w-full" style={{ maxWidth: `${maxWidth}px` }}>
        <PublicVisualStickyHeader profile={profile} identityId={identityId} />

        {heroEnabled ? (
          <VisualProfileHero profile={profile} isPreview={false}>
            {identityInsideHero ? (
              <div
                id={identityId}
                className="linkzzz-page-horizontal absolute inset-x-0 bottom-6 z-20"
              >
                {identity}
              </div>
            ) : null}
          </VisualProfileHero>
        ) : null}

        <div
          className={`${
            heroEnabled
              ? "absolute left-0 right-0 top-0 z-30"
              : "relative z-30"
          } linkzzz-page-horizontal`}
        >
          <div className="pt-4 sm:pt-5">
            <PublicTopBar profile={profile} visual={heroEnabled} />
          </div>
        </div>

        <main
          className="linkzzz-page-horizontal"
          style={{ paddingBottom: `${verticalPadding}px` }}
        >
          {!identityInsideHero ? (
            <div
              id={identityId}
              className="relative z-20"
              style={{
                marginTop: heroEnabled ? `-${heroAvatarOverlap}px` : "36px",
              }}
            >
              {identity}
            </div>
          ) : null}

          <PublicProfileLinkRuntime
            profile={profile}
            layout="visual"
            tracking={tracking}
            initialNowMs={initialNowMs}
          />

          {profile.contentBlocks.length > 0 ? (
            <div className="linkzzz-section-gap-top">
              <PublicProfileContentRuntime
                profile={profile}
                initialNowMs={initialNowMs}
              />
            </div>
          ) : null}

          <div className="linkzzz-footer-gap">
            <PublicFooter profile={profile} />
          </div>
        </main>
      </div>
    </div>
  );
}

function PublicTopBar({
  profile,
  visual,
}: {
  profile: PublicProfileData;
  visual: boolean;
}) {
  const foreground = visual ? "#ffffff" : profile.appearance.primaryTextColor;
  return (
    <div className="flex min-h-10 items-center justify-between gap-3">
      <div />
      <PublicProfileShareButton
        title={profile.displayName}
        text={profile.bio}
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border backdrop-blur-xl transition hover:scale-105"
        style={{
          color: foreground,
          borderColor: visual
            ? "rgba(255,255,255,0.18)"
            : addAlpha(profile.appearance.primaryTextColor, 0.12),
          backgroundColor: visual
            ? "rgba(0,0,0,0.25)"
            : addAlpha(profile.appearance.primaryTextColor, 0.05),
        }}
      />
    </div>
  );
}

function PublicVisualIdentityGroup({
  profile,
  heroEnabled,
  alignment,
  primaryColor,
  secondaryColor,
  showAvatar,
  showName,
  showUsername,
  showBio,
  showLocation,
  showSocials,
  showStats,
}: {
  profile: PublicProfileData;
  heroEnabled: boolean;
  alignment: "left" | "center";
  primaryColor: string;
  secondaryColor: string;
  showAvatar: boolean;
  showName: boolean;
  showUsername: boolean;
  showBio: boolean;
  showLocation: boolean;
  showSocials: boolean;
  showStats: boolean;
}) {
  const identity = profile.appearance.identity;
  const avatarSize = identity?.avatarSize ?? 88;
  const nameSize = identity?.nameSize ?? 28;
  const alignClass =
    alignment === "left" ? "items-start text-left" : "items-center text-center";

  return (
    <>
      <header className={`flex flex-col ${alignClass}`}>
        {showAvatar ? (
          <PublicProfileAvatar
            profile={profile}
            size={avatarSize}
            radius={getAvatarRadius(identity?.avatarShape ?? "circle")}
            elevated={heroEnabled}
          />
        ) : null}
        {showName ? (
          <h1
            className={`font-black tracking-[-0.03em] ${showAvatar ? "mt-4" : ""}`}
            style={{ fontSize: `${nameSize}px`, color: primaryColor }}
          >
            {profile.displayName}
          </h1>
        ) : null}
        {showUsername && profile.username ? (
          <p className="mt-1 text-sm font-medium" style={{ color: secondaryColor }}>
            @{profile.username}
          </p>
        ) : null}
        {showBio && profile.bio ? (
          <p
            className="mt-3 text-sm leading-6 sm:text-[15px]"
            style={{
              maxWidth: `${identity?.bioMaxWidth ?? 520}px`,
              color: secondaryColor,
            }}
          >
            {profile.bio}
          </p>
        ) : null}
        {showLocation && profile.locationLabel ? (
          <div className="mt-3 flex items-center gap-1.5 text-xs" style={{ color: secondaryColor }}>
            <MapPin size={13} />
            {profile.locationLabel}
          </div>
        ) : null}
      </header>
      <PublicVisitorSignals
        profile={profile}
        alignment={alignment}
        primaryColor={primaryColor}
        secondaryColor={secondaryColor}
      />
      {showSocials ? (
        <PublicSocialLinks
          profile={profile}
          mode="visual"
          alignment={alignment}
          color={primaryColor}
        />
      ) : null}
      {showStats ? (
        <PublicStats
          profile={profile}
          alignment={alignment}
          primaryColor={primaryColor}
          secondaryColor={secondaryColor}
        />
      ) : null}
    </>
  );
}

function PublicSocialLinks({
  profile,
  mode,
  alignment,
  color,
}: {
  profile: PublicProfileData;
  mode: "classic" | "visual";
  alignment?: "left" | "center";
  color?: string;
}) {
  const visibleSocials = profile.socials.filter((social) => social.visible);
  if (!visibleSocials.length) return null;

  const identity = profile.appearance.identity;
  const iconStyle = identity?.socialIconStyle ?? "circle";
  const iconSize = identity?.socialIconSize ?? 22;
  const foreground = color ?? profile.appearance.primaryTextColor;
  const resolvedAlignment = alignment ?? identity?.alignment ?? "center";

  return (
    <div
      className={`flex flex-wrap items-center ${
        mode === "visual" && resolvedAlignment === "left"
          ? "justify-start"
          : "justify-center"
      } ${mode === "classic" ? "mt-7 gap-2.5" : "mt-5 gap-3"}`}
    >
      {visibleSocials.map((social) => (
        <a
          key={social.id}
          href={social.url}
          target="_blank"
          rel="noopener noreferrer"
          data-linkzzz-social-id={social.id}
          aria-label={social.name}
          className="flex h-11 w-11 items-center justify-center border backdrop-blur-md transition duration-200 hover:-translate-y-0.5"
          style={{
            borderRadius: getSocialRadius(iconStyle),
            borderColor:
              iconStyle === "plain" ? "transparent" : addAlpha(foreground, 0.22),
            backgroundColor:
              iconStyle === "plain" ? "transparent" : addAlpha(foreground, 0.08),
            color: foreground,
          }}
        >
          <PlatformIcon platform={social.platform ?? "custom"} size={iconSize} />
        </a>
      ))}
    </div>
  );
}

function PublicStats({
  profile,
  alignment,
  primaryColor,
  secondaryColor,
}: {
  profile: PublicProfileData;
  alignment: "left" | "center";
  primaryColor: string;
  secondaryColor: string;
}) {
  const stats = profile.stats?.filter((stat) => stat.visible) ?? [];
  if (!stats.length) return null;
  return (
    <div
      className={`mt-5 flex flex-wrap ${
        alignment === "left" ? "justify-start" : "justify-center"
      } gap-8`}
    >
      {stats.map((stat) => (
        <div key={stat.id} className={alignment === "left" ? "text-left" : "text-center"}>
          <p className="text-2xl font-black tracking-tight" style={{ color: primaryColor }}>
            {stat.value}
          </p>
          <p className="mt-0.5 text-xs" style={{ color: secondaryColor }}>
            {stat.label}
          </p>
        </div>
      ))}
    </div>
  );
}

function PublicProfileAvatar({
  profile,
  size,
  radius,
  elevated = false,
}: {
  profile: PublicProfileData;
  size: number;
  radius: string;
  elevated?: boolean;
}) {
  const style: CSSProperties = {
    width: `${size}px`,
    height: `${size}px`,
    borderRadius: radius,
  };
  if (profile.avatarUrl) {
    return (
      <div
        className={`shrink-0 overflow-hidden border ${
          elevated ? "border-white/20 shadow-2xl" : "border-white/10"
        }`}
        style={style}
      >
        <UserContentImage
          src={profile.avatarUrl}
          alt={profile.displayName}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }
  return (
    <div
      className={`flex shrink-0 items-center justify-center border bg-zinc-950 font-black text-white ${
        elevated ? "border-white/20 shadow-2xl" : "border-white/10"
      }`}
      style={style}
    >
      <span style={{ fontSize: `${Math.max(size * 0.22, 14)}px` }}>
        {getInitials(profile.displayName)}
      </span>
    </div>
  );
}

function PublicVisitorSignals({
  profile,
  alignment = "center",
  primaryColor,
  secondaryColor,
}: {
  profile: PublicProfileData;
  alignment?: "left" | "center";
  primaryColor?: string;
  secondaryColor?: string;
}) {
  const messaging = resolveVisitorMessaging(profile.engagement);
  const active = messaging.activeIndicator === "STATIC_ACTIVE";
  const responseText = resolveResponseTimeLabel(profile.engagement);
  if (!active && !responseText) return null;

  const textColor = secondaryColor ?? profile.appearance.secondaryTextColor;
  const dotColor = primaryColor ?? profile.appearance.primaryTextColor;
  return (
    <div
      className={`mt-3 flex flex-wrap items-center gap-2 ${
        alignment === "left" ? "justify-start" : "justify-center"
      }`}
      aria-label="Availability information"
    >
      {active ? (
        <span
          className="inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold backdrop-blur-sm"
          style={{
            color: textColor,
            borderColor: addAlpha(dotColor, 0.2),
            backgroundColor: addAlpha(dotColor, 0.07),
          }}
        >
          <span className="h-1.5 w-1.5 rounded-full bg-brand-lime" aria-hidden="true" />
          Active
        </span>
      ) : null}
      {responseText ? (
        <span
          className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium backdrop-blur-sm"
          style={{
            color: textColor,
            borderColor: addAlpha(dotColor, 0.16),
            backgroundColor: addAlpha(dotColor, 0.05),
          }}
        >
          {responseText}
        </span>
      ) : null}
    </div>
  );
}

function PublicFooter({ profile }: { profile: PublicProfileData }) {
  return (
    <footer className="pb-3 text-center">
      <span
        className="inline-flex text-[10px] font-black tracking-[0.18em] opacity-40"
        style={{ color: profile.appearance.primaryTextColor }}
      >
        LINKZZZ
      </span>
    </footer>
  );
}

function UnavailableProfile() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-zinc-950 px-5 text-white">
      <div className="max-w-md text-center">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-zinc-900 text-lg font-black">
          LZ
        </div>
        <h1 className="mt-6 text-2xl font-bold">Profile unavailable</h1>
        <p className="mt-3 text-sm leading-6 text-zinc-500">
          This profile is currently unavailable.
        </p>
        <p className="mt-8 text-[10px] font-black tracking-[0.18em] text-zinc-700">
          LINKZZZ
        </p>
      </div>
    </main>
  );
}
