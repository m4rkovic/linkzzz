import type {
  PublicProfileData,
  PublicProfileLink,
  PublicSocialLink,
} from "@/types/profile";

export type PersistedProfileLink = PublicProfileLink;
export type PersistedSocialLink = PublicSocialLink;

export type PersistedProfileData = Omit<
  PublicProfileData,
  "links" | "socials"
> & {
  links: PersistedProfileLink[];
  socials: PersistedSocialLink[];
};
