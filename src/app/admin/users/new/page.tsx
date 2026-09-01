import CreateUserForm from "../../../../components/admin/create-user-form";

export default function CreateUserPage() {
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

            <CreateUserForm />
        </div>
    );
}