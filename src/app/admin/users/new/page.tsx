import CreateUserForm from "../../../../components/admin/create-user-form";

function formatDateInput(date: Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
}

export default function CreateUserPage() {
    const initialDate = formatDateInput(new Date());
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