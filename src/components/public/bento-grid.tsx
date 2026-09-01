"use client";

import {
    useEffect,
    useRef,
    useState,
    type ReactNode,
} from "react";

import type { LinkCardLayout, PublicProfileLink } from "@/types/profile";

/*
|--------------------------------------------------------------------------
| BENTO / MASONRY
|--------------------------------------------------------------------------
*/

const BENTO_ROW_HEIGHT =
    8;

export function BentoGrid({
    gap,
    children,
}: {
    gap: number;

    children: ReactNode;
}) {
    return (
        <div
            style={{
                display: "grid",

                gridTemplateColumns:
                    "repeat(2, minmax(0, 1fr))",

                gridAutoRows: `${BENTO_ROW_HEIGHT}px`,

                gridAutoFlow:
                    "dense",

                gap: `${gap}px`,

                alignItems:
                    "start",
            }}
        >
            {children}
        </div>
    );
}

export function BentoGridItem({
    link,
    gap,
    children,
}: {
    link: PublicProfileLink;

    gap: number;

    children: ReactNode;
}) {
    const contentRef =
        useRef<HTMLDivElement>(
            null,
        );

    const [rowSpan, setRowSpan] =
        useState(20);

    const layout =
        link.layout ??
        "button";

    const columnSpan =
        getGridColumnSpan(
            layout,
        );

    useEffect(() => {
        const element =
            contentRef.current;

        if (!element) {
            return;
        }

        function calculateSpan() {
            if (!element) {
                return;
            }

            const height =
                element.getBoundingClientRect()
                    .height;

            if (
                height <= 0
            ) {
                return;
            }

            const nextSpan =
                Math.max(
                    1,
                    Math.ceil(
                        (height + gap) /
                        (BENTO_ROW_HEIGHT +
                            gap),
                    ),
                );

            setRowSpan(
                nextSpan,
            );
        }

        calculateSpan();

        const observer =
            new ResizeObserver(
                () => {
                    calculateSpan();
                },
            );

        observer.observe(
            element,
        );

        return () => {
            observer.disconnect();
        };
    }, [
        gap,
        link.layout,
        link.aspectRatio,
        link.customStyle?.height,
        link.customStyle
            ?.borderRadius,
        link.imageUrl,
    ]);

    return (
        <div
            className={
                columnSpan === 2
                    ? "col-span-2"
                    : "col-span-1"
            }
            style={{
                gridRowEnd: `span ${rowSpan}`,

                alignSelf:
                    "start",

                minWidth: 0,
            }}
        >
            <div
                ref={contentRef}
                className="w-full"
            >
                {children}
            </div>
        </div>
    );
}

function getGridColumnSpan(
    layout: LinkCardLayout,
) {
    if (
        layout === "button" ||
        layout === "full" ||
        layout === "featured"
    ) {
        return 2;
    }

    return 1;
}
