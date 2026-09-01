import AccountDashboard from "@/components/account/account-dashboard";
import { getCurrentSession } from "@/server/auth/current-session";
import { getAccountSummary } from "@/server/account/account-service";

export default async function AccountPage() {
    const session = await getCurrentSession();
    if (!session) return null;

    const account = await getAccountSummary(session.user.id);
    if (!account) return null;

    return (
        <div className="mx-auto w-full min-w-0 max-w-7xl">
            <AccountDashboard account={account} />
        </div>
    );
}
