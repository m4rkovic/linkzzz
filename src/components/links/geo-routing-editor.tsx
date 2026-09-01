"use client";

import {
    Globe2,
    Plus,
    Trash2,
} from "lucide-react";

import type {
    GeoDestination,
} from "@/types/profile";

const countries = [
    { code: "RS", name: "Serbia" },
    { code: "DE", name: "Germany" },
    { code: "AT", name: "Austria" },
    { code: "CH", name: "Switzerland" },
    { code: "GB", name: "United Kingdom" },
    { code: "US", name: "United States" },

    { code: "HR", name: "Croatia" },
    { code: "BA", name: "Bosnia and Herzegovina" },
    { code: "ME", name: "Montenegro" },
    { code: "MK", name: "North Macedonia" },
    { code: "SI", name: "Slovenia" },

    { code: "AL", name: "Albania" },
    { code: "BG", name: "Bulgaria" },
    { code: "RO", name: "Romania" },
    { code: "HU", name: "Hungary" },

    { code: "FR", name: "France" },
    { code: "IT", name: "Italy" },
    { code: "ES", name: "Spain" },
    { code: "PT", name: "Portugal" },

    { code: "NL", name: "Netherlands" },
    { code: "BE", name: "Belgium" },

    { code: "SE", name: "Sweden" },
    { code: "NO", name: "Norway" },
    { code: "DK", name: "Denmark" },
    { code: "FI", name: "Finland" },

    { code: "PL", name: "Poland" },
    { code: "CZ", name: "Czechia" },
    { code: "SK", name: "Slovakia" },

    { code: "GR", name: "Greece" },
    { code: "TR", name: "Türkiye" },

    { code: "CA", name: "Canada" },
    { code: "AU", name: "Australia" },
    { code: "JP", name: "Japan" },
];

type GeoRoutingEditorProps = {
    destinations: GeoDestination[];

    onChange: (
        destinations: GeoDestination[],
    ) => void;
};

export default function GeoRoutingEditor({
    destinations,
    onChange,
}: GeoRoutingEditorProps) {
    function addDestination() {
        const firstAvailable =
            countries.find(
                (country) =>
                    !destinations.some(
                        (destination) =>
                            destination.countryCode ===
                            country.code,
                    ),
            );

        if (!firstAvailable) {
            return;
        }

        onChange([
            ...destinations,

            {
                id: Date.now().toString(),

                countryCode:
                    firstAvailable.code,

                countryName:
                    firstAvailable.name,

                url: "https://",
            },
        ]);
    }

    function changeCountry(
        id: string,
        countryCode: string,
    ) {
        const country =
            countries.find(
                (item) =>
                    item.code ===
                    countryCode,
            );

        if (!country) {
            return;
        }

        onChange(
            destinations.map(
                (destination) =>
                    destination.id === id
                        ? {
                            ...destination,

                            countryCode:
                                country.code,

                            countryName:
                                country.name,
                        }
                        : destination,
            ),
        );
    }

    function changeUrl(
        id: string,
        url: string,
    ) {
        onChange(
            destinations.map(
                (destination) =>
                    destination.id === id
                        ? {
                            ...destination,
                            url,
                        }
                        : destination,
            ),
        );
    }

    function removeDestination(
        id: string,
    ) {
        onChange(
            destinations.filter(
                (destination) =>
                    destination.id !== id,
            ),
        );
    }

    return (
        <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-zinc-600">
                        <Globe2 size={17} />
                    </div>

                    <div>
                        <p className="text-sm font-semibold text-zinc-900">
                            Geo routing
                        </p>

                        <p className="mt-1 text-xs leading-5 text-zinc-500">
                            Send visitors from specific
                            countries to different URLs.
                        </p>
                    </div>
                </div>

                <button
                    type="button"
                    onClick={addDestination}
                    className="flex min-h-10 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-3 text-xs font-semibold text-zinc-700 transition hover:bg-zinc-100"
                >
                    <Plus size={15} />

                    Add country
                </button>
            </div>

            {destinations.length > 0 && (
                <div className="mt-4 space-y-3">
                    {destinations.map(
                        (destination) => (
                            <div
                                key={destination.id}
                                className="rounded-xl border border-zinc-200 bg-white p-3"
                            >
                                <div className="grid gap-3 sm:grid-cols-[180px_minmax(0,1fr)_40px]">
                                    <select
                                        value={
                                            destination.countryCode
                                        }
                                        onChange={(event) =>
                                            changeCountry(
                                                destination.id,
                                                event.target.value,
                                            )
                                        }
                                        className="h-11 w-full rounded-xl border border-zinc-200 bg-white px-3 text-sm text-zinc-800 outline-none focus:border-zinc-400"
                                    >
                                        {countries.map(
                                            (country) => (
                                                <option
                                                    key={country.code}
                                                    value={country.code}
                                                    disabled={destinations.some(
                                                        (existing) =>
                                                            existing.id !==
                                                            destination.id &&
                                                            existing.countryCode ===
                                                            country.code,
                                                    )}
                                                >
                                                    {country.name}
                                                </option>
                                            ),
                                        )}
                                    </select>

                                    <input
                                        type="text"
                                        value={
                                            destination.url
                                        }
                                        onChange={(event) =>
                                            changeUrl(
                                                destination.id,
                                                event.target.value,
                                            )
                                        }
                                        placeholder="https://..."
                                        className="h-11 min-w-0 rounded-xl border border-zinc-200 px-3 text-sm text-zinc-900 outline-none focus:border-zinc-400"
                                    />

                                    <button
                                        type="button"
                                        onClick={() =>
                                            removeDestination(
                                                destination.id,
                                            )
                                        }
                                        className="flex h-11 w-full items-center justify-center rounded-xl text-zinc-400 transition hover:bg-red-50 hover:text-red-600"
                                        aria-label="Remove geo destination"
                                    >
                                        <Trash2 size={16} />
                                    </button>
                                </div>
                            </div>
                        ),
                    )}
                </div>
            )}

            {destinations.length === 0 && (
                <p className="mt-4 text-xs text-zinc-400">
                    No country-specific routes.
                    Everyone currently uses the default URL.
                </p>
            )}
        </div>
    );
}