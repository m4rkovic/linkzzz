export type UserRole = "CUSTOMER" | "ADMIN";

export type AccountStatus = "ACTIVE" | "SUSPENDED" | "DISABLED";

export type AuthenticatedPrincipal = {
  userId: string;
  role: UserRole;
  accountStatus: AccountStatus;
};
