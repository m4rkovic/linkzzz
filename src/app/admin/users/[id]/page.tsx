import UserDetails from "@/components/admin/user-details";
import { getAdminUser } from "@/server/admin/admin-service";
import { getCurrentSession } from "@/server/auth/current-session";
import { notFound, redirect } from "next/navigation";

type UserPageProps = {
    params: Promise<{
        id: string;
    }>;
};

export default async function UserPage({
    params,
}: UserPageProps) {
    const [session, { id }] = await Promise.all([getCurrentSession(), params]);
    if (!session) redirect("/login");
    if (session.principal.role !== "ADMIN") redirect("/dashboard");

    const initialData = await getAdminUser(id);
    if (!initialData) notFound();

    return <UserDetails userId={id} initialData={initialData} />;
}
