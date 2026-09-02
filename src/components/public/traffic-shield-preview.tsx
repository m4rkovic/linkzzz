export default function TrafficShieldPreview() {
  return (
    <main className="min-h-screen bg-[#09090b] px-5 py-10 text-white">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl items-center justify-center">
        <section className="w-full rounded-[32px] border border-white/10 bg-white/[0.055] p-7 shadow-2xl shadow-black/30">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-white/45">Linkzzz SmartLink</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight">Link preview</h1>
          <p className="mt-4 text-sm leading-6 text-white/60">This SmartLink is protected by Traffic Shield. Automated preview traffic does not resolve the final destination.</p>
        </section>
      </div>
    </main>
  );
}
