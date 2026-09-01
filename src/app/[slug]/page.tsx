import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";

import PublicProfile from "@/components/public/public-profile";
import {
  getVisitorCountryCode,
  resolvePublicProfileGeoRouting,
} from "@/server/geo/geo-routing";
import { getPublicProfileBySlug } from "@/server/profile/profile-service";

type PublicProfilePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: PublicProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  const profile = await getPublicProfileBySlug(slug);

  if (!profile) {
    return {
      title: "Profile not found | Linkzzz",
      description: "This Linkzzz profile does not exist.",
    };
  }

  return {
    title: `${profile.displayName} | Linkzzz`,
    description: profile.bio,
    openGraph: {
      title: profile.displayName,
      description: profile.bio,
      type: "profile",
    },
  };
}

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { slug } = await params;
  const profile = await getPublicProfileBySlug(slug);

  if (!profile) {
    notFound();
  }

  const countryCode = getVisitorCountryCode(await headers());
  const routedProfile = resolvePublicProfileGeoRouting(profile, countryCode);

  return <PublicProfile initialProfile={routedProfile} />;
}
