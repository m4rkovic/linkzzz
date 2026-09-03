import type { Metadata } from "next";
import { headers } from "next/headers";

import {
  buildPublicSmartLinkMetadata,
  renderSmartLinkRuntime,
} from "@/server/smart-links/public-runtime";

type PublicProfilePageProps = {
  params: Promise<{
    slug: string;
  }>;
};

export async function generateMetadata({
  params,
}: PublicProfilePageProps): Promise<Metadata> {
  const { slug } = await params;
  return buildPublicSmartLinkMetadata(slug);
}

export default async function PublicProfilePage({
  params,
}: PublicProfilePageProps) {
  const { slug } = await params;
  const requestHeaders = await headers();
  return renderSmartLinkRuntime(slug, requestHeaders);
}
