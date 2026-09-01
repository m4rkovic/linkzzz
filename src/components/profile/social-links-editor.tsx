"use client";

import { useState } from "react";

import {
    Eye,
    EyeOff,
    Pencil,
    Plus,
    Save,
    Trash2,
    X,
} from "lucide-react";

import {
    FaDiscord,
    FaFacebookF,
    FaGithub,
    FaInstagram,
    FaLinkedinIn,
    FaSoundcloud,
    FaSpotify,
    FaTelegramPlane,
    FaTwitch,
    FaYoutube,
} from "react-icons/fa";

import {
    FaThreads,
    FaTiktok,
    FaXTwitter,
} from "react-icons/fa6";

import { useProfile } from "@/features/profile/profile-context";

import type { PublicSocialLink } from "@/types/profile";

const platforms = [
    {
        name: "Instagram",
        icon: FaInstagram,
    },
    {
        name: "TikTok",
        icon: FaTiktok,
    },
    {
        name: "YouTube",
        icon: FaYoutube,
    },
    {
        name: "Spotify",
        icon: FaSpotify,
    },
    {
        name: "Facebook",
        icon: FaFacebookF,
    },
    {
        name: "X",
        icon: FaXTwitter,
    },
    {
        name: "Threads",
        icon: FaThreads,
    },
    {
        name: "Twitch",
        icon: FaTwitch,
    },
    {
        name: "Discord",
        icon: FaDiscord,
    },
    {
        name: "Telegram",
        icon: FaTelegramPlane,
    },
    {
        name: "LinkedIn",
        icon: FaLinkedinIn,
    },
    {
        name: "GitHub",
        icon: FaGithub,
    },
    {
        name: "SoundCloud",
        icon: FaSoundcloud,
    },
];

export default function SocialLinksEditor() {
    const {
        profile,
        setProfile,
    } = useProfile();

    const [adding, setAdding] =
        useState(false);

    const [editingId, setEditingId] =
        useState<string | null>(null);

    const [
        selectedPlatform,
        setSelectedPlatform,
    ] = useState("Instagram");

    const [draftUrl, setDraftUrl] =
        useState("");

    const socials =
        profile.socials;

    function updateSocials(
        updater: (
            current: PublicSocialLink[],
        ) => PublicSocialLink[],
    ) {
        setProfile((current) => ({
            ...current,

            socials: updater(
                current.socials,
            ),
        }));
    }

    function openAdd() {
        const firstAvailable =
            platforms.find(
                (platform) =>
                    !socials.some(
                        (social) =>
                            social.name ===
                            platform.name,
                    ),
            );

        if (!firstAvailable) {
            return;
        }

        setSelectedPlatform(
            firstAvailable.name,
        );

        setDraftUrl("");

        setEditingId(null);

        setAdding(true);
    }

    function addSocial() {
        const platform =
            platforms.find(
                (item) =>
                    item.name ===
                    selectedPlatform,
            );

        if (!platform) {
            return;
        }

        if (!draftUrl.trim()) {
            return;
        }

        const alreadyExists =
            socials.some(
                (social) =>
                    social.name ===
                    platform.name,
            );

        if (alreadyExists) {
            return;
        }

        const newSocial: PublicSocialLink = {
            id: `${platform.name
                .toLowerCase()
                .replace(/\s+/g, "-")}-${Date.now()}`,

            name: platform.name,

            url: normalizeUrl(
                draftUrl,
            ),

            visible: true,

            icon: platform.icon,
        };

        updateSocials(
            (current) => [
                ...current,
                newSocial,
            ],
        );

        setAdding(false);

        setDraftUrl("");
    }

    function startEditing(
        social: PublicSocialLink,
    ) {
        setAdding(false);

        setEditingId(
            social.id,
        );

        setDraftUrl(
            social.url,
        );
    }

    function saveEdit(
        id: string,
    ) {
        if (!draftUrl.trim()) {
            return;
        }

        updateSocials(
            (current) =>
                current.map(
                    (social) =>
                        social.id === id
                            ? {
                                ...social,

                                url: normalizeUrl(
                                    draftUrl,
                                ),
                            }
                            : social,
                ),
        );

        setEditingId(null);

        setDraftUrl("");
    }

    function cancelEdit() {
        setEditingId(null);

        setDraftUrl("");
    }

    function toggleVisibility(
        id: string,
    ) {
        updateSocials(
            (current) =>
                current.map(
                    (social) =>
                        social.id === id
                            ? {
                                ...social,

                                visible:
                                    !social.visible,
                            }
                            : social,
                ),
        );
    }

    function deleteSocial(
        id: string,
    ) {
        const confirmed =
            window.confirm(
                "Remove this social link?",
            );

        if (!confirmed) {
            return;
        }

        updateSocials(
            (current) =>
                current.filter(
                    (social) =>
                        social.id !== id,
                ),
        );

        if (
            editingId === id
        ) {
            cancelEdit();
        }
    }

    const availablePlatforms =
        platforms.filter(
            (platform) =>
                !socials.some(
                    (social) =>
                        social.name ===
                        platform.name,
                ),
        );

    return (
        <section className="w-full min-w-0 overflow-hidden rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
            {/* HEADER */}
            <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                    <h2 className="text-lg font-semibold text-zinc-950">
                        Social links
                    </h2>

                    <p className="mt-1 text-sm text-zinc-500">
                        Add social profiles shown
                        below your bio.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={openAdd}
                    disabled={
                        availablePlatforms.length ===
                        0
                    }
                    className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 sm:w-auto px-4 text-sm font-semibold text-zinc-700 transition hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40"
                >
                    <Plus size={17} />
                    Add social
                </button>
            </div>

            {/* ADD FORM */}
            {adding && (
                <div className="mt-6 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 sm:p-5">
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div>
                            <label className="text-xs font-semibold text-zinc-500">
                                Platform
                            </label>

                            <select
                                value={
                                    selectedPlatform
                                }
                                onChange={(
                                    event,
                                ) =>
                                    setSelectedPlatform(
                                        event.target
                                            .value,
                                    )
                                }
                                className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none focus:border-zinc-400"
                            >
                                {availablePlatforms.map(
                                    (platform) => (
                                        <option
                                            key={
                                                platform.name
                                            }
                                            value={
                                                platform.name
                                            }
                                        >
                                            {
                                                platform.name
                                            }
                                        </option>
                                    ),
                                )}
                            </select>
                        </div>

                        <div>
                            <label className="text-xs font-semibold text-zinc-500">
                                URL
                            </label>

                            <input
                                type="text"
                                value={draftUrl}
                                onChange={(
                                    event,
                                ) =>
                                    setDraftUrl(
                                        event.target
                                            .value,
                                    )
                                }
                                placeholder="https://..."
                                className="mt-2 h-11 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-900 outline-none focus:border-zinc-400"
                            />
                        </div>
                    </div>

                    <div className="mt-4 grid grid-cols-2 gap-2 sm:flex sm:justify-end">
                        <button
                            type="button"
                            onClick={() => {
                                setAdding(false);
                                setDraftUrl("");
                            }}
                            className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 sm:w-auto bg-white px-4 text-sm font-semibold text-zinc-700"
                        >
                            <X size={16} />
                            Cancel
                        </button>

                        <button
                            type="button"
                            onClick={addSocial}
                            className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-zinc-950 px-4 text-sm font-semibold text-white"
                        >
                            <Plus size={16} />
                            Add
                        </button>
                    </div>
                </div>
            )}

            {/* LIST */}
            <div className="mt-6 space-y-3">
                {socials.map(
                    (social) => {
                        const Icon =
                            social.icon;

                        const editing =
                            editingId ===
                            social.id;

                        return (
                            <article
                                key={social.id}
                                className="rounded-2xl border border-zinc-200 p-4"
                            >
                                {editing ? (
                                    <div>
                                        <div className="flex items-center gap-3">
                                            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-white">
                                                <Icon
                                                    size={17}
                                                />
                                            </div>

                                            <p className="text-sm font-semibold text-zinc-900">
                                                {
                                                    social.name
                                                }
                                            </p>
                                        </div>

                                        <div className="mt-4">
                                            <label className="text-xs font-semibold text-zinc-500">
                                                URL
                                            </label>

                                            <input
                                                type="text"
                                                value={
                                                    draftUrl
                                                }
                                                onChange={(
                                                    event,
                                                ) =>
                                                    setDraftUrl(
                                                        event
                                                            .target
                                                            .value,
                                                    )
                                                }
                                                className="mt-2 h-11 w-full rounded-xl border border-zinc-200 px-4 text-sm outline-none focus:border-zinc-400"
                                            />
                                        </div>

                                        <div className="mt-4 grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    saveEdit(
                                                        social.id,
                                                    )
                                                }
                                                className="flex min-h-11 items-center justify-center gap-2 rounded-xl bg-zinc-950 text-sm font-semibold text-white"
                                            >
                                                <Save
                                                    size={16}
                                                />
                                                Save
                                            </button>

                                            <button
                                                type="button"
                                                onClick={
                                                    cancelEdit
                                                }
                                                className="flex min-h-11 w-full items-center justify-center gap-2 rounded-xl border border-zinc-200 sm:w-auto text-sm font-semibold text-zinc-700"
                                            >
                                                <X
                                                    size={16}
                                                />
                                                Cancel
                                            </button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-950 text-white">
                                            <Icon
                                                size={17}
                                            />
                                        </div>

                                        <div className="min-w-0 flex-1">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <p className="text-sm font-semibold text-zinc-900">
                                                    {
                                                        social.name
                                                    }
                                                </p>

                                                {!social.visible && (
                                                    <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[10px] font-semibold text-zinc-500">
                                                        Hidden
                                                    </span>
                                                )}
                                            </div>

                                            <p className="mt-1 truncate text-xs text-zinc-400">
                                                {social.url}
                                            </p>
                                        </div>

                                        <div className="flex shrink-0 items-center">
                                            <IconButton
                                                label={
                                                    social.visible
                                                        ? "Hide"
                                                        : "Show"
                                                }
                                                onClick={() =>
                                                    toggleVisibility(
                                                        social.id,
                                                    )
                                                }
                                            >
                                                {social.visible ? (
                                                    <Eye
                                                        size={17}
                                                    />
                                                ) : (
                                                    <EyeOff
                                                        size={17}
                                                    />
                                                )}
                                            </IconButton>

                                            <IconButton
                                                label="Edit"
                                                onClick={() =>
                                                    startEditing(
                                                        social,
                                                    )
                                                }
                                            >
                                                <Pencil
                                                    size={16}
                                                />
                                            </IconButton>

                                            <IconButton
                                                label="Delete"
                                                danger
                                                onClick={() =>
                                                    deleteSocial(
                                                        social.id,
                                                    )
                                                }
                                            >
                                                <Trash2
                                                    size={16}
                                                />
                                            </IconButton>
                                        </div>
                                    </div>
                                )}
                            </article>
                        );
                    },
                )}
            </div>

            {socials.length === 0 && (
                <div className="mt-6 rounded-2xl border border-dashed border-zinc-300 px-5 py-10 text-center">
                    <p className="text-sm font-semibold text-zinc-800">
                        No social links
                    </p>

                    <p className="mt-1 text-xs text-zinc-400">
                        Add your first social
                        profile.
                    </p>
                </div>
            )}
        </section>
    );
}

function IconButton({
    label,
    onClick,
    danger = false,
    children,
}: {
    label: string;
    onClick: () => void;
    danger?: boolean;
    children:
    React.ReactNode;
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            title={label}
            aria-label={label}
            className={`flex h-10 w-9 items-center justify-center rounded-xl transition sm:w-10 ${danger
                    ? "text-zinc-400 hover:bg-red-50 hover:text-red-600"
                    : "text-zinc-400 hover:bg-zinc-100 hover:text-zinc-800"
                }`}
        >
            {children}
        </button>
    );
}

function normalizeUrl(
    value: string,
) {
    const trimmed =
        value.trim();

    if (
        trimmed.startsWith(
            "http://",
        ) ||
        trimmed.startsWith(
            "https://",
        )
    ) {
        return trimmed;
    }

    return `https://${trimmed}`;
}