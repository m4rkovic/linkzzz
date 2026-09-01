import UserDetails from "@/components/admin/user-details";

type UserPageProps = {
    params: Promise<{
        id: string;
    }>;
};

export default async function UserPage({
    params,
}: UserPageProps) {
    const { id } = await params;

    return <UserDetails userId={id} />;
}