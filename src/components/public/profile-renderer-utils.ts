import type { CSSProperties } from "react";

import type {
    LinkCardAspectRatio,
    LinkCardBackgroundType,
    LinkCardLayout,
    LinkTitlePosition,
    PublicProfileData,
    PublicProfileLink,
    VisitorLocation,
} from "@/types/profile";

/*
|--------------------------------------------------------------------------
| GEO ROUTING
|--------------------------------------------------------------------------
*/

export function resolveLinkUrl(
    link: PublicProfileLink,
    visitor?: VisitorLocation,
) {
    if (!visitor) {
        return link.url;
    }

    const destination =
        link.geoDestinations?.find(
            (route) =>
                route.countryCode.toUpperCase() ===
                visitor.countryCode.toUpperCase(),
        );

    return (
        destination?.url ||
        link.url
    );
}

/*
|--------------------------------------------------------------------------
| PAGE BACKGROUND
|--------------------------------------------------------------------------
*/

export function getPageBackground(
    profile: PublicProfileData,
) {
    const appearance =
        profile.appearance;

    if (
        appearance.backgroundType ===
        "gradient"
    ) {
        return `linear-gradient(
      135deg,
      ${appearance.gradientFrom},
      ${appearance.gradientTo}
    )`;
    }

    return appearance.backgroundColor;
}

/*
|--------------------------------------------------------------------------
| VISUAL CARD BACKGROUND
|--------------------------------------------------------------------------
*/

export function getVisualCardBackground(
    type: LinkCardBackgroundType,
    custom:
        | PublicProfileLink["customStyle"]
        | undefined,
    appearance: PublicProfileData["appearance"],
) {
    if (
        type === "solid"
    ) {
        return (
            custom?.backgroundColor ??
            appearance.buttonBackgroundColor
        );
    }

    if (
        type === "gradient"
    ) {
        return `linear-gradient(
      145deg,
      ${custom?.gradientFrom ??
            appearance.gradientFrom
            },
      ${custom?.gradientTo ??
            appearance.gradientTo
            }
    )`;
    }

    return `linear-gradient(
    145deg,
    ${appearance.buttonBackgroundColor},
    ${appearance.gradientTo}
  )`;
}

/*
|--------------------------------------------------------------------------
| CLASSIC BUTTON STYLE
|--------------------------------------------------------------------------
*/

export function getButtonStyle(
    appearance: PublicProfileData["appearance"],
): CSSProperties {
    const base: CSSProperties = {
        borderRadius: `${appearance.borderRadius}px`,

        color:
            appearance.buttonTextColor,

        boxShadow:
            getClassicShadow(
                appearance.shadow,
            ),
    };

    if (
        appearance.buttonStyle ===
        "outline"
    ) {
        return {
            ...base,

            backgroundColor:
                "transparent",

            borderColor:
                appearance.buttonBorderColor,
        };
    }

    if (
        appearance.buttonStyle ===
        "glass"
    ) {
        return {
            ...base,

            backgroundColor:
                addAlpha(
                    appearance.buttonBackgroundColor,
                    0.13,
                ),

            borderColor:
                addAlpha(
                    appearance.buttonBorderColor,
                    0.34,
                ),

            backdropFilter:
                "blur(14px)",
        };
    }

    return {
        ...base,

        backgroundColor:
            appearance.buttonBackgroundColor,

        borderColor:
            appearance.buttonBorderColor,
    };
}

/*
|--------------------------------------------------------------------------
| ASPECT RATIO
|--------------------------------------------------------------------------
*/

export function getAspectRatioValue(
    ratio:
        LinkCardAspectRatio,
) {
    if (
        ratio === "square"
    ) {
        return "1 / 1";
    }

    if (
        ratio === "landscape"
    ) {
        return "4 / 3";
    }

    if (
        ratio === "portrait"
    ) {
        return "3 / 4";
    }

    if (
        ratio === "wide"
    ) {
        return "16 / 9";
    }

    return undefined;
}

/*
|--------------------------------------------------------------------------
| CARD SIZE
|--------------------------------------------------------------------------
*/

export function getGlobalCardHeight(
    layout: LinkCardLayout,
    normalHeight: number,
    featuredHeight: number,
) {
    if (
        layout === "featured"
    ) {
        return featuredHeight;
    }

    if (
        layout === "compact"
    ) {
        return Math.min(
            normalHeight,
            140,
        );
    }

    if (
        layout === "half"
    ) {
        return Math.min(
            normalHeight,
            210,
        );
    }

    return normalHeight;
}

/*
|--------------------------------------------------------------------------
| HOVER
|--------------------------------------------------------------------------
*/

export function getHoverClass(
    effect:
        | "none"
        | "lift"
        | "scale"
        | "glow",
) {
    if (
        effect === "lift"
    ) {
        return "hover:-translate-y-1";
    }

    if (
        effect === "scale"
    ) {
        return "hover:scale-[1.015]";
    }

    if (
        effect === "glow"
    ) {
        return "hover:brightness-110";
    }

    return "";
}

/*
|--------------------------------------------------------------------------
| SHADOWS
|--------------------------------------------------------------------------
*/

function getClassicShadow(
    shadow: number,
) {
    if (
        shadow <= 0
    ) {
        return "none";
    }

    return `0 ${shadow * 4
        }px ${shadow * 14
        }px rgba(0,0,0,${0.08 +
        shadow *
        0.04
        })`;
}

export function getCardShadow(
    shadow: number,
) {
    if (
        shadow <= 0
    ) {
        return "none";
    }

    return `0 ${shadow * 5
        }px ${shadow * 18
        }px rgba(0,0,0,${0.09 +
        shadow *
        0.04
        })`;
}

/*
|--------------------------------------------------------------------------
| POSITION
|--------------------------------------------------------------------------
*/

export function getTitlePositionClass(
    position:
        LinkTitlePosition,
) {
    if (
        position === "center"
    ) {
        return "items-center justify-center";
    }

    if (
        position ===
        "bottom-center"
    ) {
        return "items-end justify-center";
    }

    return "items-end justify-start";
}

export function getAvatarRadius(
    shape:
        | "circle"
        | "rounded"
        | "square",
) {
    if (
        shape === "square"
    ) {
        return "0px";
    }

    if (
        shape === "rounded"
    ) {
        return "22%";
    }

    return "50%";
}

export function getSocialRadius(
    style:
        | "plain"
        | "circle"
        | "square",
) {
    if (
        style === "plain"
    ) {
        return "0px";
    }

    if (
        style === "square"
    ) {
        return "12px";
    }

    return "9999px";
}

/*
|--------------------------------------------------------------------------
| INITIALS
|--------------------------------------------------------------------------
*/

export function getInitials(
    name: string,
) {
    return (
        name
            .split(" ")
            .filter(Boolean)
            .map(
                (part) =>
                    part[0],
            )
            .join("")
            .slice(0, 2)
            .toUpperCase() ||
        "LZ"
    );
}

/*
|--------------------------------------------------------------------------
| HEX -> RGBA
|--------------------------------------------------------------------------
*/

export function addAlpha(
    color: string,
    alpha: number,
) {
    const match =
        /^#([0-9a-f]{6})$/i.exec(
            color.trim(),
        );

    if (!match) {
        return color;
    }

    const value =
        match[1];

    const red =
        parseInt(
            value.slice(
                0,
                2,
            ),
            16,
        );

    const green =
        parseInt(
            value.slice(
                2,
                4,
            ),
            16,
        );

    const blue =
        parseInt(
            value.slice(
                4,
                6,
            ),
            16,
        );

    return `rgba(${red}, ${green}, ${blue}, ${alpha})`;
}

export function getObjectPosition(
    position:
        | "center"
        | "top"
        | "bottom"
        | "left"
        | "right",
) {
    if (
        position === "top"
    ) {
        return "center top";
    }

    if (
        position === "bottom"
    ) {
        return "center bottom";
    }

    if (
        position === "left"
    ) {
        return "left center";
    }

    if (
        position === "right"
    ) {
        return "right center";
    }

    return "center center";
}
