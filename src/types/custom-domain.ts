export type CustomDomainDnsRecord = {
  type: "TXT" | "CNAME";
  name: string;
  value: string;
};

export type CustomDomainView = {
  id: string;
  smartLinkId: string;
  domain: string;
  status: "PENDING" | "VERIFIED" | "ACTIVE" | "DISABLED";
  verifiedAt: string | null;
  claimExpiresAt: string | null;
  claimExpired: boolean;
  verificationDueAt: string | null;
  verificationRequired: boolean;
  dns: {
    verification: CustomDomainDnsRecord;
    routing: CustomDomainDnsRecord;
  };
};

export type AdminCustomDomainView = CustomDomainView & {
  ownerUserId: string;
  ownerUsername: string;
  smartLinkTitle: string;
  smartLinkSlug: string;
};
