import { defaultAppearance } from "@/config/profile-defaults";
import type { ProfileAppearance } from "@/types/profile";

export type AppearancePreset = {
  id: string;
  mode: "classic" | "visual";
  name: string;
  description: string;
  swatches: [string, string, string];
  apply: () => Partial<ProfileAppearance>;
};

export const APPEARANCE_FONTS = [
  "Inter, Arial, sans-serif",
  "Arial, sans-serif",
  "Georgia, serif",
  "Verdana, sans-serif",
  "Trebuchet MS, sans-serif",
  "Courier New, monospace",
];

export const APPEARANCE_PRESETS: AppearancePreset[] = [
  {
    id: "classic-dark",
    mode: "classic",
    name: "Classic Dark",
    description: "Clean dark Linkzzz buttons.",
    swatches: ["#111214", "#18181b", "#ffffff"],
    apply: () => ({
      ...defaultAppearance,
      layoutMode: "classic",
      backgroundType: "solid",
      backgroundColor: "#111214",
      primaryTextColor: "#ffffff",
      secondaryTextColor: "#a1a1aa",
      buttonStyle: "glass",
      buttonBackgroundColor: "#18181b",
      buttonTextColor: "#ffffff",
      buttonBorderColor: "#ffffff",
    }),
  },
  {
    id: "classic-light",
    mode: "classic",
    name: "Classic Light",
    description: "Minimal white profile.",
    swatches: ["#fafafa", "#ffffff", "#09090b"],
    apply: () => ({
      ...defaultAppearance,
      layoutMode: "classic",
      backgroundType: "solid",
      backgroundColor: "#fafafa",
      primaryTextColor: "#09090b",
      secondaryTextColor: "#71717a",
      buttonStyle: "outline",
      buttonBackgroundColor: "#ffffff",
      buttonTextColor: "#09090b",
      buttonBorderColor: "#d4d4d8",
    }),
  },
  {
    id: "visual-night",
    mode: "visual",
    name: "Visual Night",
    description: "Dark creator-style image cards.",
    swatches: ["#050505", "#27272a", "#ffffff"],
    apply: () => ({
      ...defaultAppearance,
      layoutMode: "visual",
      backgroundType: "solid",
      backgroundColor: "#050505",
      primaryTextColor: "#ffffff",
      secondaryTextColor: "#a1a1aa",
      hero: {
        ...defaultAppearance.hero!,
        enabled: true,
        height: 350,
        overlayEnabled: true,
        overlayColor: "#000000",
        overlayOpacity: 0.32,
        profilePosition: "over-hero",
        contentPosition: "bottom-center",
        imageFit: "cover",
        imagePosition: "center",
        fullBleed: true,
      },
      identity: {
        ...defaultAppearance.identity!,
        alignment: "center",
        avatarSize: 96,
        avatarShape: "circle",
        socialIconStyle: "plain",
      },
      cards: {
        ...defaultAppearance.cards!,
        defaultLayout: "half",
        borderRadius: 24,
        cardHeight: 230,
        featuredHeight: 370,
        overlayOpacity: 0.38,
        titlePosition: "bottom-center",
        titleSize: 22,
        borderWidth: 0,
        shadow: 2,
        hoverEffect: "lift",
      },
    }),
  },
  {
    id: "visual-editorial",
    mode: "visual",
    name: "Editorial",
    description: "Large type and structured cards.",
    swatches: ["#f4f1ea", "#d6d0c4", "#111111"],
    apply: () => ({
      ...defaultAppearance,
      layoutMode: "visual",
      backgroundType: "solid",
      backgroundColor: "#f4f1ea",
      primaryTextColor: "#111111",
      secondaryTextColor: "#5f5b53",
      fontFamily: "Georgia, serif",
      hero: {
        ...defaultAppearance.hero!,
        enabled: true,
        height: 290,
        overlayOpacity: 0.18,
        profilePosition: "below-hero",
        contentPosition: "below",
        imageFit: "cover",
        imagePosition: "center",
        fullBleed: false,
      },
      identity: {
        ...defaultAppearance.identity!,
        alignment: "left",
        avatarShape: "rounded",
        avatarSize: 92,
        nameSize: 34,
        socialIconStyle: "square",
      },
      cards: {
        ...defaultAppearance.cards!,
        defaultLayout: "full",
        borderRadius: 8,
        spacing: 14,
        cardHeight: 250,
        featuredHeight: 400,
        titlePosition: "bottom-left",
        titleSize: 24,
        borderWidth: 0,
        shadow: 1,
        hoverEffect: "none",
      },
    }),
  },
  {
    id: "visual-neon",
    mode: "visual",
    name: "Neon",
    description: "Gradient background with bold cards.",
    swatches: ["#09090b", "#6d28d9", "#ffffff"],
    apply: () => ({
      ...defaultAppearance,
      layoutMode: "visual",
      backgroundType: "gradient",
      gradientFrom: "#09090b",
      gradientTo: "#21113c",
      primaryTextColor: "#ffffff",
      secondaryTextColor: "#d4d4d8",
      hero: {
        ...defaultAppearance.hero!,
        enabled: true,
        height: 330,
        overlayOpacity: 0.25,
        profilePosition: "over-hero",
        contentPosition: "bottom-center",
        imageFit: "cover",
        imagePosition: "center",
        fullBleed: true,
      },
      identity: {
        ...defaultAppearance.identity!,
        alignment: "center",
        socialIconStyle: "circle",
      },
      cards: {
        ...defaultAppearance.cards!,
        defaultLayout: "half",
        borderRadius: 22,
        borderWidth: 1,
        shadow: 4,
        hoverEffect: "glow",
      },
    }),
  },
  {
    id: "classic-ocean",
    mode: "classic",
    name: "Ocean Glass",
    description: "Cool blue gradient with translucent buttons.",
    swatches: ["#082f49", "#0e7490", "#ecfeff"],
    apply: () => ({ ...defaultAppearance, layoutMode: "classic", backgroundType: "gradient", gradientFrom: "#082f49", gradientTo: "#155e75", primaryTextColor: "#ecfeff", secondaryTextColor: "#a5f3fc", buttonStyle: "glass", buttonBackgroundColor: "#0e7490", buttonTextColor: "#ecfeff", buttonBorderColor: "#67e8f9", borderRadius: 18, shadow: 3 }),
  },
  {
    id: "classic-warm",
    mode: "classic",
    name: "Warm Paper",
    description: "Soft editorial colors with rounded filled buttons.",
    swatches: ["#f7f1e8", "#9a3412", "#2b2118"],
    apply: () => ({ ...defaultAppearance, layoutMode: "classic", backgroundType: "solid", backgroundColor: "#f7f1e8", primaryTextColor: "#2b2118", secondaryTextColor: "#786b5e", fontFamily: "Georgia, serif", buttonStyle: "filled", buttonBackgroundColor: "#9a3412", buttonTextColor: "#fff7ed", buttonBorderColor: "#9a3412", borderRadius: 999, shadow: 1 }),
  },
  {
    id: "classic-mono",
    mode: "classic",
    name: "Mono Blocks",
    description: "Sharp monochrome buttons with compact spacing.",
    swatches: ["#ffffff", "#111111", "#737373"],
    apply: () => ({ ...defaultAppearance, layoutMode: "classic", backgroundType: "solid", backgroundColor: "#ffffff", primaryTextColor: "#111111", secondaryTextColor: "#737373", fontFamily: "Courier New, monospace", buttonStyle: "filled", buttonBackgroundColor: "#111111", buttonTextColor: "#ffffff", buttonBorderColor: "#111111", borderRadius: 4, buttonSpacing: 9, shadow: 0 }),
  },
  {
    id: "visual-studio",
    mode: "visual",
    name: "Soft Studio",
    description: "Pastel canvas with spacious rounded feature cards.",
    swatches: ["#fdf2f8", "#f9a8d4", "#831843"],
    apply: () => ({ ...defaultAppearance, layoutMode: "visual", backgroundType: "gradient", gradientFrom: "#fdf2f8", gradientTo: "#ede9fe", primaryTextColor: "#3b1834", secondaryTextColor: "#7e5b75", hero: { ...defaultAppearance.hero!, enabled: true, height: 300, contentPosition: "below", profilePosition: "below-hero", fullBleed: false }, identity: { ...defaultAppearance.identity!, alignment: "center", avatarShape: "rounded", avatarSize: 96 }, cards: { ...defaultAppearance.cards!, defaultLayout: "featured", borderRadius: 30, spacing: 18, cardHeight: 250, featuredHeight: 390, titlePosition: "bottom-left", titleSize: 23, borderWidth: 0, shadow: 2, hoverEffect: "scale" } }),
  },
  {
    id: "visual-grid",
    mode: "visual",
    name: "Bold Grid",
    description: "Compact split cards with crisp corners and strong type.",
    swatches: ["#facc15", "#18181b", "#ffffff"],
    apply: () => ({ ...defaultAppearance, layoutMode: "visual", backgroundType: "solid", backgroundColor: "#facc15", primaryTextColor: "#18181b", secondaryTextColor: "#3f3f46", hero: { ...defaultAppearance.hero!, enabled: false }, identity: { ...defaultAppearance.identity!, alignment: "left", avatarShape: "square", nameSize: 36, socialIconStyle: "square" }, cards: { ...defaultAppearance.cards!, defaultLayout: "half", borderRadius: 2, spacing: 10, cardHeight: 200, featuredHeight: 330, titlePosition: "bottom-left", titleSize: 21, borderWidth: 2, shadow: 0, hoverEffect: "lift" } }),
  },
  {
    id: "visual-cinema",
    mode: "visual",
    name: "Cinema",
    description: "Wide cinematic tiles on a deep black canvas.",
    swatches: ["#000000", "#b91c1c", "#f5f5f5"],
    apply: () => ({ ...defaultAppearance, layoutMode: "visual", backgroundType: "solid", backgroundColor: "#000000", primaryTextColor: "#f5f5f5", secondaryTextColor: "#a3a3a3", hero: { ...defaultAppearance.hero!, enabled: true, height: 420, fullBleed: true, contentPosition: "bottom-left", profilePosition: "over-hero", overlayOpacity: 0.5 }, identity: { ...defaultAppearance.identity!, alignment: "left", avatarSize: 80, socialIconStyle: "plain" }, cards: { ...defaultAppearance.cards!, defaultLayout: "full", borderRadius: 10, spacing: 16, cardHeight: 280, featuredHeight: 430, titlePosition: "bottom-left", titleSize: 26, borderWidth: 0, shadow: 4, hoverEffect: "scale" } }),
  },

  /*
  |--------------------------------------------------------------------------
  | NEW CLASSIC PRESETS
  |--------------------------------------------------------------------------
  */

  {
    id: "classic-forest",
    mode: "classic",
    name: "Forest",
    description: "Deep green background with filled earthy buttons.",
    swatches: ["#0f1f16", "#166534", "#ecfdf5"],
    apply: () => ({ ...defaultAppearance, layoutMode: "classic", backgroundType: "gradient", gradientFrom: "#0f1f16", gradientTo: "#14291d", primaryTextColor: "#ecfdf5", secondaryTextColor: "#86efac", buttonStyle: "filled", buttonBackgroundColor: "#166534", buttonTextColor: "#ecfdf5", buttonBorderColor: "#166534", borderRadius: 14, shadow: 2 }),
  },
  {
    id: "classic-blush",
    mode: "classic",
    name: "Blush Outline",
    description: "Soft pink backdrop with thin outline buttons.",
    swatches: ["#fff1f2", "#fb7185", "#4c0519"],
    apply: () => ({ ...defaultAppearance, layoutMode: "classic", backgroundType: "solid", backgroundColor: "#fff1f2", primaryTextColor: "#4c0519", secondaryTextColor: "#9f1239", buttonStyle: "outline", buttonBackgroundColor: "#ffffff", buttonTextColor: "#4c0519", buttonBorderColor: "#fb7185", borderRadius: 999, buttonSpacing: 12, shadow: 0 }),
  },
  {
    id: "classic-slate",
    mode: "classic",
    name: "Slate Glass",
    description: "Cool neutral gray with frosted glass buttons.",
    swatches: ["#1e293b", "#334155", "#f1f5f9"],
    apply: () => ({ ...defaultAppearance, layoutMode: "classic", backgroundType: "solid", backgroundColor: "#1e293b", primaryTextColor: "#f1f5f9", secondaryTextColor: "#94a3b8", buttonStyle: "glass", buttonBackgroundColor: "#334155", buttonTextColor: "#f1f5f9", buttonBorderColor: "#64748b", borderRadius: 12, shadow: 2 }),
  },
  {
    id: "classic-sunset",
    mode: "classic",
    name: "Sunset",
    description: "Warm orange-to-pink gradient with filled buttons.",
    swatches: ["#7c2d12", "#ea580c", "#fff7ed"],
    apply: () => ({ ...defaultAppearance, layoutMode: "classic", backgroundType: "gradient", gradientFrom: "#7c2d12", gradientTo: "#9d174d", primaryTextColor: "#fff7ed", secondaryTextColor: "#fed7aa", buttonStyle: "filled", buttonBackgroundColor: "#ea580c", buttonTextColor: "#fff7ed", buttonBorderColor: "#ea580c", borderRadius: 16, shadow: 3 }),
  },
  {
    id: "classic-lavender",
    mode: "classic",
    name: "Lavender",
    description: "Light purple background, tight sans, outline buttons.",
    swatches: ["#f5f3ff", "#a78bfa", "#312e81"],
    apply: () => ({ ...defaultAppearance, layoutMode: "classic", backgroundType: "solid", backgroundColor: "#f5f3ff", primaryTextColor: "#312e81", secondaryTextColor: "#6d28d9", fontFamily: "Trebuchet MS, sans-serif", buttonStyle: "outline", buttonBackgroundColor: "#ffffff", buttonTextColor: "#312e81", buttonBorderColor: "#a78bfa", borderRadius: 10, shadow: 0 }),
  },
  {
    id: "classic-charcoal-mono",
    mode: "classic",
    name: "Charcoal Type",
    description: "Near-black background with monospace filled buttons.",
    swatches: ["#0a0a0a", "#262626", "#e5e5e5"],
    apply: () => ({ ...defaultAppearance, layoutMode: "classic", backgroundType: "solid", backgroundColor: "#0a0a0a", primaryTextColor: "#e5e5e5", secondaryTextColor: "#737373", fontFamily: "Courier New, monospace", buttonStyle: "filled", buttonBackgroundColor: "#262626", buttonTextColor: "#e5e5e5", buttonBorderColor: "#404040", borderRadius: 2, buttonSpacing: 8, shadow: 0 }),
  },

  /*
  |--------------------------------------------------------------------------
  | NEW VISUAL PRESETS
  |--------------------------------------------------------------------------
  */

  {
    id: "visual-magazine",
    mode: "visual",
    name: "Magazine",
    description: "Full-width feature cards on a warm cream canvas.",
    swatches: ["#faf6ef", "#e8dcc8", "#1c1917"],
    apply: () => ({ ...defaultAppearance, layoutMode: "visual", backgroundType: "solid", backgroundColor: "#faf6ef", primaryTextColor: "#1c1917", secondaryTextColor: "#78716c", fontFamily: "Georgia, serif", hero: { ...defaultAppearance.hero!, enabled: true, height: 260, contentPosition: "below", profilePosition: "below-hero", fullBleed: false }, identity: { ...defaultAppearance.identity!, alignment: "left", avatarShape: "square", nameSize: 32, socialIconStyle: "plain" }, cards: { ...defaultAppearance.cards!, defaultLayout: "featured", borderRadius: 6, spacing: 16, cardHeight: 260, featuredHeight: 410, titlePosition: "bottom-left", titleSize: 22, borderWidth: 1, shadow: 1, hoverEffect: "none" } }),
  },
  {
    id: "visual-arcade",
    mode: "visual",
    name: "Arcade",
    description: "High-contrast gradient with square glowing tiles.",
    swatches: ["#020617", "#22d3ee", "#f472b6"],
    apply: () => ({ ...defaultAppearance, layoutMode: "visual", backgroundType: "gradient", gradientFrom: "#020617", gradientTo: "#1e1b4b", primaryTextColor: "#ecfeff", secondaryTextColor: "#a5f3fc", hero: { ...defaultAppearance.hero!, enabled: false }, identity: { ...defaultAppearance.identity!, alignment: "center", avatarShape: "square", socialIconStyle: "square" }, cards: { ...defaultAppearance.cards!, defaultLayout: "half", borderRadius: 4, spacing: 12, cardHeight: 210, featuredHeight: 340, titlePosition: "center", titleSize: 20, borderWidth: 2, shadow: 3, hoverEffect: "glow" } }),
  },
  {
    id: "visual-desert",
    mode: "visual",
    name: "Desert",
    description: "Sandy tones with a wide hero and full-bleed layout.",
    swatches: ["#fef3c7", "#b45309", "#451a03"],
    apply: () => ({ ...defaultAppearance, layoutMode: "visual", backgroundType: "gradient", gradientFrom: "#fef3c7", gradientTo: "#fed7aa", primaryTextColor: "#451a03", secondaryTextColor: "#92400e", hero: { ...defaultAppearance.hero!, enabled: true, height: 310, overlayOpacity: 0.15, profilePosition: "over-hero", contentPosition: "bottom-left", fullBleed: true }, identity: { ...defaultAppearance.identity!, alignment: "left", avatarShape: "rounded", avatarSize: 88 }, cards: { ...defaultAppearance.cards!, defaultLayout: "half", borderRadius: 16, spacing: 12, cardHeight: 220, featuredHeight: 350, titlePosition: "bottom-left", titleSize: 20, borderWidth: 0, shadow: 2, hoverEffect: "lift" } }),
  },
  {
    id: "visual-glacier",
    mode: "visual",
    name: "Glacier",
    description: "Icy blue-white palette with tall portrait cards.",
    swatches: ["#f0f9ff", "#7dd3fc", "#0c4a6e"],
    apply: () => ({ ...defaultAppearance, layoutMode: "visual", backgroundType: "solid", backgroundColor: "#f0f9ff", primaryTextColor: "#0c4a6e", secondaryTextColor: "#0369a1", hero: { ...defaultAppearance.hero!, enabled: true, height: 280, profilePosition: "below-hero", contentPosition: "below", fullBleed: false }, identity: { ...defaultAppearance.identity!, alignment: "center", avatarShape: "circle", avatarSize: 92, socialIconStyle: "circle" }, cards: { ...defaultAppearance.cards!, defaultLayout: "featured", borderRadius: 20, spacing: 14, cardHeight: 260, featuredHeight: 400, titlePosition: "bottom-center", titleSize: 22, borderWidth: 1, shadow: 1, hoverEffect: "scale" } }),
  },
  {
    id: "visual-industrial",
    mode: "visual",
    name: "Industrial",
    description: "Concrete gray tones with sharp full-width blocks.",
    swatches: ["#3f3f46", "#71717a", "#fafafa"],
    apply: () => ({ ...defaultAppearance, layoutMode: "visual", backgroundType: "solid", backgroundColor: "#3f3f46", primaryTextColor: "#fafafa", secondaryTextColor: "#d4d4d8", hero: { ...defaultAppearance.hero!, enabled: true, height: 260, profilePosition: "over-hero", contentPosition: "bottom-left", overlayOpacity: 0.45, fullBleed: true }, identity: { ...defaultAppearance.identity!, alignment: "left", avatarShape: "square", socialIconStyle: "square" }, cards: { ...defaultAppearance.cards!, defaultLayout: "full", borderRadius: 0, spacing: 8, cardHeight: 240, featuredHeight: 380, titlePosition: "bottom-left", titleSize: 24, borderWidth: 1, shadow: 0, hoverEffect: "none" } }),
  },
  {
    id: "visual-botanical",
    mode: "visual",
    name: "Botanical",
    description: "Sage green with soft rounded compact cards.",
    swatches: ["#f0fdf4", "#86efac", "#14532d"],
    apply: () => ({ ...defaultAppearance, layoutMode: "visual", backgroundType: "gradient", gradientFrom: "#f0fdf4", gradientTo: "#dcfce7", primaryTextColor: "#14532d", secondaryTextColor: "#4d7c0f", hero: { ...defaultAppearance.hero!, enabled: true, height: 270, profilePosition: "below-hero", contentPosition: "below", fullBleed: false }, identity: { ...defaultAppearance.identity!, alignment: "center", avatarShape: "rounded", avatarSize: 90, socialIconStyle: "circle" }, cards: { ...defaultAppearance.cards!, defaultLayout: "compact", borderRadius: 20, spacing: 10, cardHeight: 150, featuredHeight: 320, titlePosition: "bottom-center", titleSize: 17, borderWidth: 0, shadow: 1, hoverEffect: "lift" } }),
  },
];

export const CLASSIC_APPEARANCE_PRESETS = APPEARANCE_PRESETS.filter((preset) => preset.mode === "classic");
export const VISUAL_APPEARANCE_PRESETS = APPEARANCE_PRESETS.filter((preset) => preset.mode === "visual");

export function getFontName(value: string) {
  return value.split(",")[0] ?? value;
}


// import { defaultAppearance } from "@/config/profile-defaults";
// import type { ProfileAppearance } from "@/types/profile";

// export type AppearancePreset = {
//   id: string;
//   mode: "classic" | "visual";
//   name: string;
//   description: string;
//   swatches: [string, string, string];
//   apply: () => Partial<ProfileAppearance>;
// };

// export const APPEARANCE_FONTS = [
//   "Inter, Arial, sans-serif",
//   "Arial, sans-serif",
//   "Georgia, serif",
//   "Verdana, sans-serif",
//   "Trebuchet MS, sans-serif",
//   "Courier New, monospace",
// ];

// export const APPEARANCE_PRESETS: AppearancePreset[] = [
//   {
//     id: "classic-dark",
//     mode: "classic",
//     name: "Classic Dark",
//     description: "Clean dark Linkzzz buttons.",
//     swatches: ["#111214", "#18181b", "#ffffff"],
//     apply: () => ({
//       ...defaultAppearance,
//       layoutMode: "classic",
//       backgroundType: "solid",
//       backgroundColor: "#111214",
//       primaryTextColor: "#ffffff",
//       secondaryTextColor: "#a1a1aa",
//       buttonStyle: "glass",
//       buttonBackgroundColor: "#18181b",
//       buttonTextColor: "#ffffff",
//       buttonBorderColor: "#ffffff",
//     }),
//   },
//   {
//     id: "classic-light",
//     mode: "classic",
//     name: "Classic Light",
//     description: "Minimal white profile.",
//     swatches: ["#fafafa", "#ffffff", "#09090b"],
//     apply: () => ({
//       ...defaultAppearance,
//       layoutMode: "classic",
//       backgroundType: "solid",
//       backgroundColor: "#fafafa",
//       primaryTextColor: "#09090b",
//       secondaryTextColor: "#71717a",
//       buttonStyle: "outline",
//       buttonBackgroundColor: "#ffffff",
//       buttonTextColor: "#09090b",
//       buttonBorderColor: "#d4d4d8",
//     }),
//   },
//   {
//     id: "visual-night",
//     mode: "visual",
//     name: "Visual Night",
//     description: "Dark creator-style image cards.",
//     swatches: ["#050505", "#27272a", "#ffffff"],
//     apply: () => ({
//       ...defaultAppearance,
//       layoutMode: "visual",
//       backgroundType: "solid",
//       backgroundColor: "#050505",
//       primaryTextColor: "#ffffff",
//       secondaryTextColor: "#a1a1aa",
//       hero: {
//         ...defaultAppearance.hero!,
//         enabled: true,
//         height: 350,
//         overlayEnabled: true,
//         overlayColor: "#000000",
//         overlayOpacity: 0.32,
//         profilePosition: "over-hero",
//         contentPosition: "bottom-center",
//         imageFit: "cover",
//         imagePosition: "center",
//         fullBleed: true,
//       },
//       identity: {
//         ...defaultAppearance.identity!,
//         alignment: "center",
//         avatarSize: 96,
//         avatarShape: "circle",
//         socialIconStyle: "plain",
//       },
//       cards: {
//         ...defaultAppearance.cards!,
//         defaultLayout: "half",
//         borderRadius: 24,
//         cardHeight: 230,
//         featuredHeight: 370,
//         overlayOpacity: 0.38,
//         titlePosition: "bottom-center",
//         titleSize: 22,
//         borderWidth: 0,
//         shadow: 2,
//         hoverEffect: "lift",
//       },
//     }),
//   },
//   {
//     id: "visual-editorial",
//     mode: "visual",
//     name: "Editorial",
//     description: "Large type and structured cards.",
//     swatches: ["#f4f1ea", "#d6d0c4", "#111111"],
//     apply: () => ({
//       ...defaultAppearance,
//       layoutMode: "visual",
//       backgroundType: "solid",
//       backgroundColor: "#f4f1ea",
//       primaryTextColor: "#111111",
//       secondaryTextColor: "#5f5b53",
//       fontFamily: "Georgia, serif",
//       hero: {
//         ...defaultAppearance.hero!,
//         enabled: true,
//         height: 290,
//         overlayOpacity: 0.18,
//         profilePosition: "below-hero",
//         contentPosition: "below",
//         imageFit: "cover",
//         imagePosition: "center",
//         fullBleed: false,
//       },
//       identity: {
//         ...defaultAppearance.identity!,
//         alignment: "left",
//         avatarShape: "rounded",
//         avatarSize: 92,
//         nameSize: 34,
//         socialIconStyle: "square",
//       },
//       cards: {
//         ...defaultAppearance.cards!,
//         defaultLayout: "full",
//         borderRadius: 8,
//         spacing: 14,
//         cardHeight: 250,
//         featuredHeight: 400,
//         titlePosition: "bottom-left",
//         titleSize: 24,
//         borderWidth: 0,
//         shadow: 1,
//         hoverEffect: "none",
//       },
//     }),
//   },
//   {
//     id: "visual-neon",
//     mode: "visual",
//     name: "Neon",
//     description: "Gradient background with bold cards.",
//     swatches: ["#09090b", "#6d28d9", "#ffffff"],
//     apply: () => ({
//       ...defaultAppearance,
//       layoutMode: "visual",
//       backgroundType: "gradient",
//       gradientFrom: "#09090b",
//       gradientTo: "#21113c",
//       primaryTextColor: "#ffffff",
//       secondaryTextColor: "#d4d4d8",
//       hero: {
//         ...defaultAppearance.hero!,
//         enabled: true,
//         height: 330,
//         overlayOpacity: 0.25,
//         profilePosition: "over-hero",
//         contentPosition: "bottom-center",
//         imageFit: "cover",
//         imagePosition: "center",
//         fullBleed: true,
//       },
//       identity: {
//         ...defaultAppearance.identity!,
//         alignment: "center",
//         socialIconStyle: "circle",
//       },
//       cards: {
//         ...defaultAppearance.cards!,
//         defaultLayout: "half",
//         borderRadius: 22,
//         borderWidth: 1,
//         shadow: 4,
//         hoverEffect: "glow",
//       },
//     }),
//   },
//   {
//     id: "classic-ocean",
//     mode: "classic",
//     name: "Ocean Glass",
//     description: "Cool blue gradient with translucent buttons.",
//     swatches: ["#082f49", "#0e7490", "#ecfeff"],
//     apply: () => ({ ...defaultAppearance, layoutMode: "classic", backgroundType: "gradient", gradientFrom: "#082f49", gradientTo: "#155e75", primaryTextColor: "#ecfeff", secondaryTextColor: "#a5f3fc", buttonStyle: "glass", buttonBackgroundColor: "#0e7490", buttonTextColor: "#ecfeff", buttonBorderColor: "#67e8f9", borderRadius: 18, shadow: 3 }),
//   },
//   {
//     id: "classic-warm",
//     mode: "classic",
//     name: "Warm Paper",
//     description: "Soft editorial colors with rounded filled buttons.",
//     swatches: ["#f7f1e8", "#9a3412", "#2b2118"],
//     apply: () => ({ ...defaultAppearance, layoutMode: "classic", backgroundType: "solid", backgroundColor: "#f7f1e8", primaryTextColor: "#2b2118", secondaryTextColor: "#786b5e", fontFamily: "Georgia, serif", buttonStyle: "filled", buttonBackgroundColor: "#9a3412", buttonTextColor: "#fff7ed", buttonBorderColor: "#9a3412", borderRadius: 999, shadow: 1 }),
//   },
//   {
//     id: "classic-mono",
//     mode: "classic",
//     name: "Mono Blocks",
//     description: "Sharp monochrome buttons with compact spacing.",
//     swatches: ["#ffffff", "#111111", "#737373"],
//     apply: () => ({ ...defaultAppearance, layoutMode: "classic", backgroundType: "solid", backgroundColor: "#ffffff", primaryTextColor: "#111111", secondaryTextColor: "#737373", fontFamily: "Courier New, monospace", buttonStyle: "filled", buttonBackgroundColor: "#111111", buttonTextColor: "#ffffff", buttonBorderColor: "#111111", borderRadius: 4, buttonSpacing: 9, shadow: 0 }),
//   },
//   {
//     id: "visual-studio",
//     mode: "visual",
//     name: "Soft Studio",
//     description: "Pastel canvas with spacious rounded feature cards.",
//     swatches: ["#fdf2f8", "#f9a8d4", "#831843"],
//     apply: () => ({ ...defaultAppearance, layoutMode: "visual", backgroundType: "gradient", gradientFrom: "#fdf2f8", gradientTo: "#ede9fe", primaryTextColor: "#3b1834", secondaryTextColor: "#7e5b75", hero: { ...defaultAppearance.hero!, enabled: true, height: 300, contentPosition: "below", profilePosition: "below-hero", fullBleed: false }, identity: { ...defaultAppearance.identity!, alignment: "center", avatarShape: "rounded", avatarSize: 96 }, cards: { ...defaultAppearance.cards!, defaultLayout: "featured", borderRadius: 30, spacing: 18, cardHeight: 250, featuredHeight: 390, titlePosition: "bottom-left", titleSize: 23, borderWidth: 0, shadow: 2, hoverEffect: "scale" } }),
//   },
//   {
//     id: "visual-grid",
//     mode: "visual",
//     name: "Bold Grid",
//     description: "Compact split cards with crisp corners and strong type.",
//     swatches: ["#facc15", "#18181b", "#ffffff"],
//     apply: () => ({ ...defaultAppearance, layoutMode: "visual", backgroundType: "solid", backgroundColor: "#facc15", primaryTextColor: "#18181b", secondaryTextColor: "#3f3f46", hero: { ...defaultAppearance.hero!, enabled: false }, identity: { ...defaultAppearance.identity!, alignment: "left", avatarShape: "square", nameSize: 36, socialIconStyle: "square" }, cards: { ...defaultAppearance.cards!, defaultLayout: "half", borderRadius: 2, spacing: 10, cardHeight: 200, featuredHeight: 330, titlePosition: "bottom-left", titleSize: 21, borderWidth: 2, shadow: 0, hoverEffect: "lift" } }),
//   },
//   {
//     id: "visual-cinema",
//     mode: "visual",
//     name: "Cinema",
//     description: "Wide cinematic tiles on a deep black canvas.",
//     swatches: ["#000000", "#b91c1c", "#f5f5f5"],
//     apply: () => ({ ...defaultAppearance, layoutMode: "visual", backgroundType: "solid", backgroundColor: "#000000", primaryTextColor: "#f5f5f5", secondaryTextColor: "#a3a3a3", hero: { ...defaultAppearance.hero!, enabled: true, height: 420, fullBleed: true, contentPosition: "bottom-left", profilePosition: "over-hero", overlayOpacity: 0.5 }, identity: { ...defaultAppearance.identity!, alignment: "left", avatarSize: 80, socialIconStyle: "plain" }, cards: { ...defaultAppearance.cards!, defaultLayout: "full", borderRadius: 10, spacing: 16, cardHeight: 280, featuredHeight: 430, titlePosition: "bottom-left", titleSize: 26, borderWidth: 0, shadow: 4, hoverEffect: "scale" } }),
//   },
// ];

// export const CLASSIC_APPEARANCE_PRESETS = APPEARANCE_PRESETS.filter((preset) => preset.mode === "classic");
// export const VISUAL_APPEARANCE_PRESETS = APPEARANCE_PRESETS.filter((preset) => preset.mode === "visual");

// export function getFontName(value: string) {
//   return value.split(",")[0] ?? value;
// }
