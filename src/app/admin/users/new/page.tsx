import { redirect } from "next/navigation";

import CreateUserForm from "../../../../components/admin/create-user-form";
import { getCurrentSession } from "@/server/auth/current-session";
import { formatSubscriptionDateInput } from "@/server/business/subscription-dates";

export default async function CreateUserPage() {
    const session = await getCurrentSession();
    if (!session) redirect("/login");
    if (session.principal.role !== "ADMIN") redirect("/dashboard");

    const initialDate = formatSubscriptionDateInput(new Date());
    return (
        <div className="mx-auto max-w-7xl">
            <div className="mb-6 sm:mb-8">
                <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
                    Create customer
                </h1>

                <p className="mt-1 text-sm text-zinc-500">
                    Create a new Linkzzz account and configure its initial subscription.
                </p>
            </div>

            <CreateUserForm initialDate={initialDate} />
        </div>
    );
}
