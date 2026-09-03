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
  dns: {
    verification: CustomDomainDnsRecord;
    routing: CustomDomainDnsRecord;
  };
};
