import Link from "next/link";
import { ArrowLeft, ExternalLink, Pencil } from "lucide-react";
import { notFound, redirect } from "next/navigation";

import AnalyticsDashboard from "@/components/analytics/analytics-dashboard";
import { Badge } from "@/components/ui/badge";
import { buttonClassName } from "@/components/ui/button";
import { getSmartLinkAnalyticsDashboard } from "@/server/analytics/analytics-service";
import { getCurrentSession } from "@/server/auth/current-session";

export default async function SmartLinkAnalyticsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const session = await getCurrentSession();
  if (!session) redirect("/login");
  if (session.user.role !== "CUSTOMER") redirect("/admin");

  const { id } = await params;
  const data = await getSmartLinkAnalyticsDashboard(session.user.id, id);
  if (!data?.scope) notFound();
  const scope = data.scope;

  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl">
      <Link
        href="/dashboard/analytics"
        className="inline-flex items-center gap-2 text-sm font-bold text-zinc-500 transition hover:text-zinc-950"
      >
        <ArrowLeft size={16} /> Back to Analytics
      </Link>

      <div className="mt-5 mb-6 flex min-w-0 flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <h1 className="truncate text-2xl font-black tracking-tight text-zinc-950 sm:text-3xl">{scope.title}</h1>
            <Badge tone={scope.type === "LANDING_PAGE" ? "accent" : "neutral"}>
              {scope.type === "LANDING_PAGE" ? "LANDING PAGE" : "DIRECT"}
            </Badge>
            <StatusBadge status={scope.status} />
          </div>
          <p className="mt-2 truncate text-sm text-zinc-500">/{scope.slug}</p>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex">
          <Link
            href={`/dashboard/links/${scope.id}`}
            className={buttonClassName({ variant: "secondary", size: "sm" })}
          >
            <Pencil size={15} /> Edit Link
          </Link>
          {scope.status === "PUBLISHED" ? (
            <Link
              href={`/${scope.slug}`}
              target="_blank"
              className={buttonClassName({ variant: "primary", size: "sm" })}
            >
              Open <ExternalLink size={15} />
            </Link>
          ) : null}
        </div>
      </div>

      <AnalyticsDashboard snapshots={data.snapshots} scope={scope} />
    </div>
  );
}

function StatusBadge({ status }: { status: "DRAFT" | "PUBLISHED" | "DISABLED" }) {
  const tone = status === "PUBLISHED" ? "success" : status === "DISABLED" ? "danger" : "neutral";
  return <Badge tone={tone}>{status}</Badge>;
}
