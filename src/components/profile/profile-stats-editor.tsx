"use client";

import { useState } from "react";
import {
    Eye,
    EyeOff,
    Plus,
    Trash2,
} from "lucide-react";

import { useProfile } from "@/features/profile/profile-context";
import ConfirmDialog from "@/components/ui/confirm-dialog";

import type {
    ProfileStat,
} from "@/types/profile";

const MAX_STATS = 4;

export default function ProfileStatsEditor() {
    const {
        profile,
        setProfile,
    } = useProfile();

    const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);

    const stats =
        profile.stats ?? [];

    function updateStats(
        updater: (
            current: ProfileStat[],
        ) => ProfileStat[],
    ) {
        setProfile((current) => ({
            ...current,

            stats: updater(
                current.stats ?? [],
            ),
        }));
    }

    function addStat() {
        if (
            stats.length >=
            MAX_STATS
        ) {
            return;
        }

        const newStat: ProfileStat = {
            id: crypto.randomUUID(),

            value: "100K",

            label: "Total Followers",

            visible: true,
        };

        updateStats(
            (current) => [
                ...current,
                newStat,
            ],
        );
    }

    function updateStat(
        id: string,
        values: Partial<ProfileStat>,
    ) {
        updateStats(
            (current) =>
                current.map(
                    (stat) =>
                        stat.id === id
                            ? {
                                ...stat,
                                ...values,
                            }
                            : stat,
                ),
        );
    }

    function toggleStat(
        id: string,
    ) {
        updateStats(
            (current) =>
                current.map(
                    (stat) =>
                        stat.id === id
                            ? {
                                ...stat,
                                visible:
                                    !stat.visible,
                            }
                            : stat,
                ),
        );
    }

    function deleteStat(
        id: string,
    ) {
        updateStats(
            (current) =>
                current.filter(
                    (stat) =>
                        stat.id !== id,
                ),
        );
        setPendingDeleteId(null);
    }

    return (
        <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
            {/* HEADER */}
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-zinc-950">
                        Profile stats
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">
                        Highlight followers,
                        listeners or any other
                        public statistic.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={addStat}
                    disabled={
                        stats.length >=
                        MAX_STATS
                    }
                    className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 sm:w-auto bg-white px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <Plus size={16} />

                    Add stat
                </button>
            </div>

            {/* INFO */}
            <div className="mt-5 rounded-xl bg-zinc-50 px-4 py-3 text-xs leading-5 text-zinc-500">
                Stats are primarily designed
                for Visual profiles. You can
                show up to {MAX_STATS}.
            </div>

            {/* EMPTY */}
            {stats.length === 0 && (
                <div className="mt-5 rounded-2xl border border-dashed border-zinc-300 px-5 py-10 text-center">
                    <p className="text-sm font-semibold text-zinc-800">
                        No profile stats
                    </p>

                    <p className="mt-1 text-xs text-zinc-400">
                        Add something like
                        followers or monthly
                        listeners.
                    </p>
                </div>
            )}

            {/* STATS */}
            {stats.length > 0 && (
                <div className="mt-5 space-y-3">
                    {stats.map(
                        (stat) => (
                            <article
                                key={stat.id}
                                className="rounded-2xl border border-zinc-200 p-4"
                            >
                                <div className="grid gap-4 sm:grid-cols-[150px_minmax(0,1fr)_auto] sm:items-end">
                                    {/* VALUE */}
                                    <div>
                                        <label className="text-xs font-semibold text-zinc-500">
                                            Value
                                        </label>

                                        <input
                                            type="text"
                                            value={
                                                stat.value
                                            }
                                            maxLength={20}
                                            placeholder="1.4M"
                                            onChange={(
                                                event,
                                            ) =>
                                                updateStat(
                                                    stat.id,
                                                    {
                                                        value:
                                                            event
                                                                .target
                                                                .value,
                                                    },
                                                )
                                            }
                                            className="mt-2 h-11 w-full rounded-xl border border-zinc-200 px-4 text-sm font-semibold text-zinc-950 outline-none transition focus:border-zinc-400"
                                        />
                                    </div>

                                    {/* LABEL */}
                                    <div>
                                        <label className="text-xs font-semibold text-zinc-500">
                                            Label
                                        </label>

                                        <input
                                            type="text"
                                            value={
                                                stat.label
                                            }
                                            maxLength={50}
                                            placeholder="Total Followers"
                                            onChange={(
                                                event,
                                            ) =>
                                                updateStat(
                                                    stat.id,
                                                    {
                                                        label:
                                                            event
                                                                .target
                                                                .value,
                                                    },
                                                )
                                            }
                                            className="mt-2 h-11 w-full rounded-xl border border-zinc-200 px-4 text-sm text-zinc-950 outline-none transition focus:border-zinc-400"
                                        />
                                    </div>

                                    {/* ACTIONS */}
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            type="button"
                                            onClick={() =>
                                                toggleStat(
                                                    stat.id,
                                                )
                                            }
                                            title={
                                                stat.visible
                                                    ? "Hide"
                                                    : "Show"
                                            }
                                            aria-label={
                                                stat.visible
                                                    ? "Hide stat"
                                                    : "Show stat"
                                            }
                                            className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-800"
                                        >
                                            {stat.visible ? (
                                                <Eye
                                                    size={17}
                                                />
                                            ) : (
                                                <EyeOff
                                                    size={17}
                                                />
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            onClick={() => setPendingDeleteId(stat.id)}
                                            title="Delete"
                                            aria-label="Delete stat"
                                            className="flex h-11 w-11 items-center justify-center rounded-xl text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
                                        >
                                            <Trash2
                                                size={16}
                                            />
                                        </button>
                                    </div>
                                </div>

                                {!stat.visible && (
                                    <div className="mt-3">
                                        <span className="rounded-full bg-zinc-100 px-2.5 py-1 text-[10px] font-semibold text-zinc-500">
                                            Hidden
                                        </span>
                                    </div>
                                )}
                            </article>
                        ),
                    )}
                </div>
            )}

            <ConfirmDialog
                open={Boolean(pendingDeleteId)}
                title="Delete profile stat?"
                description="This stat will be removed from the Page. Save the Page to persist the change."
                confirmLabel="Delete stat"
                destructive
                onClose={() => setPendingDeleteId(null)}
                onConfirm={() => pendingDeleteId && deleteStat(pendingDeleteId)}
            />
        </section>
    );
}
