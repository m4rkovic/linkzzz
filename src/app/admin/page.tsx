import Link from "next/link";

import {
    AlertTriangle,
    BarChart3,
    CheckCircle2,
    Clock3,
    Crown,
    MousePointerClick,
    UserRoundCheck,
    Users,
} from "lucide-react";

const stats = [
    {
        label: "Total customers",
        value: "86",
        detail: "All customer accounts",
        icon: Users,
    },
    {
        label: "Active subscriptions",
        value: "73",
        detail: "Currently active",
        icon: CheckCircle2,
    },
    {
        label: "Expiring soon",
        value: "8",
        detail: "Next 7 days",
        icon: Clock3,
    },
    {
        label: "Expired",
        value: "5",
        detail: "Awaiting renewal",
        icon: AlertTriangle,
    },
];

const expiringUsers = [
    {
        id: 1,
        name: "Sky Hook",
        username: "skyhook",
        plan: "Premium Plus",
        links: "57 / 100",
        expiry: "Sep 01, 2026",
        days: 2,
    },
    {
        id: 2,
        name: "Marko Music",
        username: "markomusic",
        plan: "Premium",
        links: "34 / 40",
        expiry: "Sep 02, 2026",
        days: 3,
    },
    {
        id: 3,
        name: "Studio 22",
        username: "studio22",
        plan: "Premium",
        links: "21 / 40",
        expiry: "Sep 04, 2026",
        days: 5,
    },
];

export default function AdminPage() {
    return (
        <div className="mx-auto max-w-7xl space-y-6">
            {/* HEADER */}
            <div>
                <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
                    Overview
                </h1>

                <p className="mt-1 text-sm text-zinc-500">
                    Monitor customers, subscriptions and platform activity.
                </p>
            </div>

            {/* MAIN KPI */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                {stats.map((stat) => {
                    const Icon = stat.icon;

                    return (
                        <div
                            key={stat.label}
                            className="rounded-2xl border border-zinc-200 bg-white p-5"
                        >
                            <div className="flex items-start justify-between gap-4">
                                <div>
                                    <p className="text-sm font-medium text-zinc-500">
                                        {stat.label}
                                    </p>

                                    <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">
                                        {stat.value}
                                    </p>
                                </div>

                                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-700">
                                    <Icon size={20} />
                                </div>
                            </div>

                            <p className="mt-4 text-xs text-zinc-400">
                                {stat.detail}
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* PLAN / PROFILE STATS */}
            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
                <StatPanel
                    icon={Crown}
                    title="Premium"
                    value="52"
                    subtitle="40 link limit"
                />

                <StatPanel
                    icon={UserRoundCheck}
                    title="Premium Plus"
                    value="34"
                    subtitle="100 link limit"
                />

                <StatPanel
                    icon={BarChart3}
                    title="Published profiles"
                    value="79"
                    subtitle="Currently public"
                />
            </div>

            {/* EXPIRING SOON */}
            <section className="overflow-hidden rounded-2xl border border-zinc-200 bg-white">
                <div className="flex flex-col gap-4 border-b border-zinc-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
                    <div>
                        <h2 className="text-lg font-semibold text-zinc-950">
                            Expiring soon
                        </h2>

                        <p className="mt-1 text-sm text-zinc-500">
                            Subscriptions expiring within the next 7 days.
                        </p>
                    </div>

                    <Link
                        href="/admin/users?view=expiring"
                        className="flex min-h-10 shrink-0 items-center justify-center rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50"
                    >
                        View all
                    </Link>
                </div>

                {/* DESKTOP TABLE */}
                <div className="hidden overflow-x-auto lg:block">
                    <table className="w-full">
                        <thead>
                            <tr className="border-b border-zinc-100 bg-zinc-50 text-left">
                                <TableHeading>
                                    Customer
                                </TableHeading>

                                <TableHeading>
                                    Plan
                                </TableHeading>

                                <TableHeading>
                                    Links
                                </TableHeading>

                                <TableHeading>
                                    Expiry
                                </TableHeading>

                                <TableHeading>
                                    Remaining
                                </TableHeading>

                                <th className="px-6 py-3" />
                            </tr>
                        </thead>

                        <tbody>
                            {expiringUsers.map((user) => (
                                <tr
                                    key={user.id}
                                    className="border-b border-zinc-100 last:border-b-0 hover:bg-zinc-50/60"
                                >
                                    <td className="px-6 py-4">
                                        <CustomerIdentity
                                            name={user.name}
                                            username={user.username}
                                        />
                                    </td>

                                    <td className="px-6 py-4">
                                        <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                                            {user.plan}
                                        </span>
                                    </td>

                                    <td className="px-6 py-4 text-sm font-medium text-zinc-700">
                                        {user.links}
                                    </td>

                                    <td className="px-6 py-4 text-sm font-medium text-zinc-700">
                                        {user.expiry}
                                    </td>

                                    <td className="px-6 py-4">
                                        <RemainingBadge days={user.days} />
                                    </td>

                                    <td className="px-6 py-4 text-right">
                                        <Link
                                            href={`/admin/users/${user.id}`}
                                            className="inline-flex min-h-10 items-center justify-center rounded-xl border border-zinc-200 px-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-50"
                                        >
                                            Manage
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* MOBILE / TABLET */}
                <div className="grid gap-3 p-4 lg:hidden">
                    {expiringUsers.map((user) => (
                        <article
                            key={user.id}
                            className="rounded-2xl border border-zinc-200 bg-white p-4"
                        >
                            <CustomerIdentity
                                name={user.name}
                                username={user.username}
                            />

                            <div className="mt-4 flex flex-wrap gap-2">
                                <span className="inline-flex rounded-full bg-zinc-100 px-2.5 py-1 text-xs font-semibold text-zinc-700">
                                    {user.plan}
                                </span>

                                <RemainingBadge days={user.days} />
                            </div>

                            <div className="mt-4 grid grid-cols-2 gap-4 border-y border-zinc-100 py-4">
                                <div>
                                    <p className="text-xs font-medium text-zinc-400">
                                        Links
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-zinc-800">
                                        {user.links}
                                    </p>
                                </div>

                                <div>
                                    <p className="text-xs font-medium text-zinc-400">
                                        Expiry
                                    </p>

                                    <p className="mt-1 text-sm font-semibold text-zinc-800">
                                        {user.expiry}
                                    </p>
                                </div>
                            </div>

                            <Link
                                href={`/admin/users/${user.id}`}
                                className="mt-4 flex min-h-11 w-full items-center justify-center rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white transition hover:bg-zinc-800"
                            >
                                Manage customer
                            </Link>
                        </article>
                    ))}
                </div>
            </section>

            {/* PLATFORM STATS */}
            <div className="grid gap-4 lg:grid-cols-2">
                <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-5">
                        <div>
                            <p className="text-sm font-medium text-zinc-500">
                                Platform visits
                            </p>

                            <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">
                                384,129
                            </p>
                        </div>

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
                            <BarChart3 size={21} />
                        </div>
                    </div>

                    <p className="mt-4 text-xs leading-5 text-zinc-400">
                        Across all published customer profiles.
                    </p>
                </section>

                <section className="rounded-2xl border border-zinc-200 bg-white p-5 sm:p-6">
                    <div className="flex items-center justify-between gap-5">
                        <div>
                            <p className="text-sm font-medium text-zinc-500">
                                Platform link clicks
                            </p>

                            <p className="mt-2 text-3xl font-bold tracking-tight text-zinc-950">
                                148,822
                            </p>
                        </div>

                        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
                            <MousePointerClick size={21} />
                        </div>
                    </div>

                    <p className="mt-4 text-xs leading-5 text-zinc-400">
                        Total tracked customer link clicks.
                    </p>
                </section>
            </div>
        </div>
    );
}

function StatPanel({
    icon: Icon,
    title,
    value,
    subtitle,
}: {
    icon: React.ElementType;
    title: string;
    value: string;
    subtitle: string;
}) {
    return (
        <section className="rounded-2xl border border-zinc-200 bg-white p-5">
            <div className="flex items-center gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600">
                    <Icon size={19} />
                </div>

                <div className="min-w-0">
                    <p className="text-sm font-medium text-zinc-500">
                        {title}
                    </p>

                    <div className="mt-1 flex flex-wrap items-end gap-x-2 gap-y-1">
                        <span className="text-2xl font-bold text-zinc-950">
                            {value}
                        </span>

                        <span className="pb-0.5 text-xs text-zinc-400">
                            {subtitle}
                        </span>
                    </div>
                </div>
            </div>
        </section>
    );
}

function CustomerIdentity({
    name,
    username,
}: {
    name: string;
    username: string;
}) {
    const initials =
        name
            .split(" ")
            .filter(Boolean)
            .map((part) => part[0])
            .join("")
            .slice(0, 2)
            .toUpperCase() || "CU";

    return (
        <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-zinc-950 text-xs font-bold text-white">
                {initials}
            </div>

            <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-zinc-900">
                    {name}
                </p>

                <p className="mt-0.5 truncate text-xs text-zinc-400">
                    @{username}
                </p>
            </div>
        </div>
    );
}

function RemainingBadge({
    days,
}: {
    days: number;
}) {
    return (
        <span
            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${days <= 2
                    ? "bg-red-50 text-red-700"
                    : "bg-amber-50 text-amber-700"
                }`}
        >
            {days} days
        </span>
    );
}

function TableHeading({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <th className="px-6 py-3 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            {children}
        </th>
    );
}