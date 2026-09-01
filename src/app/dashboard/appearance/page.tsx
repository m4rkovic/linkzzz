import AppearanceEditor from "@/components/appearance/appearance-editor";

export default function AppearancePage() {
    return (
        <div className="mx-auto w-full min-w-0 max-w-7xl">
            <div className="mb-5 min-w-0 sm:mb-6">
                <h1 className="text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl">
                    Appearance
                </h1>

                <p className="mt-1 text-sm text-zinc-500">
                    Customize how your public profile looks.
                </p>
            </div>

            <AppearanceEditor />
        </div>
    );
}