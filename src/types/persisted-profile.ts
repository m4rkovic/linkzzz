import type {
  PublicProfileData,
  PublicProfileLink,
  PublicSocialLink,
} from "@/types/profile";

export type PersistedProfileLink = Omit<PublicProfileLink, "icon">;
export type PersistedSocialLink = Omit<PublicSocialLink, "icon">;

export type PersistedProfileData = Omit<
  PublicProfileData,
  "links" | "socials"
> & {
  links: PersistedProfileLink[];
  socials: PersistedSocialLink[];
};
