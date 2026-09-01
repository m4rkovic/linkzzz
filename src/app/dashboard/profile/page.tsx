import ProfileEditor from "@/components/profile/profile-editor";

export default function ProfilePage() {
  return (
    <div className="mx-auto w-full min-w-0 max-w-7xl">
      <div className="mb-5 min-w-0 sm:mb-6">
        <h1 className="text-xl font-bold tracking-tight text-zinc-950 sm:text-2xl">
          Profile
        </h1>

        <p className="mt-1 text-sm text-zinc-500">
          Manage the information visitors see on your public profile.
        </p>
      </div>

      <ProfileEditor />
    </div>
  );
}