import "server-only";

import type { ServerDependencies } from "@/server/services/contracts";
import { ensureJsonDatabaseInitialized } from "@/server/persistence/json/bootstrap";
import { JsonAuditWriter } from "@/server/persistence/json/repositories/json-audit-writer";
import { JsonPasswordCredentialRepository } from "@/server/persistence/json/repositories/json-password-credential-repository";
import { JsonProfileRepository } from "@/server/persistence/json/repositories/json-profile-repository";
import { JsonSessionRepository } from "@/server/persistence/json/repositories/json-session-repository";
import { JsonSubscriptionRepository } from "@/server/persistence/json/repositories/json-subscription-repository";
import { JsonUserRepository } from "@/server/persistence/json/repositories/json-user-repository";

let dependenciesPromise: Promise<ServerDependencies> | null = null;

export function getJsonServerDependencies(): Promise<ServerDependencies> {
  if (!dependenciesPromise) {
    dependenciesPromise = (async () => {
      await ensureJsonDatabaseInitialized();

      const users = new JsonUserRepository();
      const subscriptions = new JsonSubscriptionRepository();
      const profiles = new JsonProfileRepository();
      const passwords = new JsonPasswordCredentialRepository();
      const audit = new JsonAuditWriter();

      return {
        users,
        subscriptions,
        profiles,
        passwords,
        sessions: new JsonSessionRepository(),
        audit,
        customerProvisioning: {
          async create(input) {
            const user = await users.create({
              username: input.username,
              email: input.email,
              role: "CUSTOMER",
              accountStatus: "ACTIVE",
            });
            await passwords.setPasswordHash(user.id, input.passwordHash);
            await passwords.setMustChangePassword(user.id, input.mustChangePassword);
            await subscriptions.upsert({ ...input.subscription, userId: user.id });
            await profiles.upsert(user.id, input.profile);
            await audit.write({ actorUserId: input.actorUserId, targetUserId: user.id, action: "USER_CREATED", resourceType: "USER", resourceId: user.id, metadata: { plan: input.subscription.plan, slug: input.profile.slug } });
            await audit.write({ actorUserId: input.actorUserId, targetUserId: user.id, action: "SUBSCRIPTION_RENEWED", resourceType: "SUBSCRIPTION", resourceId: user.id, metadata: { months: 0, initial: true } });
            return user;
          },
        },
      };
    })();
  }

  return dependenciesPromise;
}
