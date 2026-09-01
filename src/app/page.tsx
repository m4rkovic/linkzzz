import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { isIP } from "node:net";
import Dashboard from "../app/dashboard/page";
import PublicProfile from "@/components/public/public-profile";
import { resolveActiveCustomDomain } from "@/server/domains/custom-domain-service";
import {
  getVisitorCountryCode,
  resolvePublicProfileGeoRouting,
} from "@/server/geo/geo-routing";
import { getPublicProfileBySlug } from "@/server/profile/profile-service";

export default async function Home() {
  const requestHeaders = await headers();
  const host = normalizeHost(requestHeaders.get("x-forwarded-host") ?? requestHeaders.get("host"));
  if (host && !isApplicationHost(host)) {
    const slug = await resolveActiveCustomDomain(host);
    if (!slug) notFound();
    const profile = await getPublicProfileBySlug(slug);
    if (!profile) notFound();
    const countryCode = getVisitorCountryCode(requestHeaders);
    return (
      <PublicProfile
        initialProfile={resolvePublicProfileGeoRouting(profile, countryCode)}
      />
    );
  }

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <Dashboard />
    </div>
  );
}

function normalizeHost(value: string | null) {
  if (!value) return null;
  const first = value.split(",")[0]?.trim().toLowerCase() ?? "";
  return first.startsWith("[") ? first.slice(1, first.indexOf("]")) : first.split(":")[0];
}

function isApplicationHost(host: string) {
  if (host === "localhost" || host.endsWith(".localhost") || isIP(host)) return true;
  const configured = (process.env.LINKZZZ_APP_HOSTS ?? "linkzzz.com,www.linkzzz.com")
    .split(",")
    .map((value) => value.trim().toLowerCase())
    .filter(Boolean);
  return configured.includes(host);
}
