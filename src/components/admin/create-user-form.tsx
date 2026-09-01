"use client";

import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CalendarDays, Check, Eye, EyeOff, KeyRound, Link2, Mail, RefreshCw, ShieldCheck, Sparkles, UserRound } from "lucide-react";
import type { AdminPlan as Plan } from "@/features/admin/admin-types";

const inputClass = "h-12 w-full rounded-xl border border-zinc-200 bg-white px-4 text-sm text-zinc-950 shadow-sm outline-none transition placeholder:text-zinc-400 hover:border-zinc-300 focus:border-zinc-950 focus:ring-4 focus:ring-zinc-950/5";
function formatDateInput(date: Date) { const year = date.getFullYear(); const month = String(date.getMonth() + 1).padStart(2, "0"); const day = String(date.getDate()).padStart(2, "0"); return `${year}-${month}-${day}`; }
function addMonthsClamped(source: Date, months: number) { const day = source.getDate(); const target = new Date(source); target.setDate(1); target.setMonth(target.getMonth() + months); target.setDate(Math.min(day, new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate())); return target; }

export default function CreateUserForm() {
  const router = useRouter();
  const today = useMemo(() => new Date(), []);
  const [displayName, setDisplayName] = useState(""); const [username, setUsername] = useState(""); const [email, setEmail] = useState(""); const [slug, setSlug] = useState("");
  const [password, setPassword] = useState(""); const [showPassword, setShowPassword] = useState(false); const [plan, setPlan] = useState<Plan>("PREMIUM");
  const [startDate, setStartDate] = useState(formatDateInput(today)); const [expiryDate, setExpiryDate] = useState(formatDateInput(addMonthsClamped(today, 1)));
  const [autoRenew, setAutoRenew] = useState(false); const [mustChangePassword, setMustChangePassword] = useState(true); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);

  function handleUsername(value: string) { const next = value.toLowerCase().replace(/[^a-z0-9_-]/g, ""); if (!slug || slug === username) setSlug(next); setUsername(next); }
  function generatePassword() { const chars = "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%"; const bytes = new Uint32Array(16); crypto.getRandomValues(bytes); setPassword(Array.from(bytes, (value) => chars[value % chars.length]).join("")); setShowPassword(true); }
  async function submit(event: FormEvent<HTMLFormElement>) { event.preventDefault(); setError(""); setBusy(true); try { const response = await fetch("/api/admin/users", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ displayName, username, email, slug, password, plan, periodStart: `${startDate}T12:00:00`, periodEnd: `${expiryDate}T12:00:00`, autoRenew, mustChangePassword }) }); const body = await response.json(); if (!response.ok) throw new Error(body.error ?? "Unable to create customer."); router.push(`/admin/users/${body.user.id}`); router.refresh(); } catch (caught) { setError(caught instanceof Error ? caught.message : "Unable to create customer."); } finally { setBusy(false); } }

  return (
    <form onSubmit={submit} className="mx-auto max-w-6xl">
      {error && <div role="alert" className="mb-5 rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">{error}</div>}
      <div className="grid items-start gap-6 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="space-y-5">
          <FormSection icon={UserRound} title="Customer information" description="Account identity and public profile address.">
            <div className="grid gap-5 sm:grid-cols-2">
              <Field label="Display name"><input value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="Sky Hook" className={inputClass} required /></Field>
              <Field label="Login username"><input value={username} onChange={(event) => handleUsername(event.target.value)} placeholder="skyhook" className={inputClass} required /></Field>
              <Field label="Email address" icon={Mail}><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="contact@example.com" className={inputClass} required /></Field>
              <Field label="Public slug" icon={Link2}><div className="flex h-12 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm focus-within:border-zinc-950 focus-within:ring-4 focus-within:ring-zinc-950/5"><span className="hidden items-center border-r border-zinc-200 bg-zinc-50 px-3 text-xs font-medium text-zinc-500 md:flex">linkzzz.com/</span><input value={slug} onChange={(event) => setSlug(event.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, ""))} placeholder="skyhook" className="min-w-0 flex-1 px-4 text-sm text-zinc-950 outline-none placeholder:text-zinc-400" required /></div></Field>
            </div>
          </FormSection>

          <FormSection icon={KeyRound} title="Login & security" description="Generate secure temporary credentials for the customer.">
            <Field label="Temporary password"><div className="flex flex-col gap-3 sm:flex-row"><div className="relative min-w-0 flex-1"><input type={showPassword ? "text" : "password"} value={password} onChange={(event) => setPassword(event.target.value)} placeholder="At least 10 characters" className={`${inputClass} pr-12 font-mono`} required /><button type="button" onClick={() => setShowPassword((value) => !value)} className="absolute right-1.5 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-950" aria-label="Show or hide password">{showPassword ? <EyeOff size={17} /> : <Eye size={17} />}</button></div><button type="button" onClick={generatePassword} className="inline-flex min-h-12 shrink-0 items-center justify-center gap-2 rounded-xl border border-zinc-200 bg-white px-4 text-sm font-semibold text-zinc-700 shadow-sm transition hover:border-zinc-300 hover:bg-zinc-50"><Sparkles size={16} />Generate</button></div></Field>
            <Toggle checked={mustChangePassword} onChange={setMustChangePassword} title="Require password change" description="Customer creates a new password after the first successful sign-in." />
          </FormSection>

          <FormSection icon={CalendarDays} title="Plan & subscription" description="Choose access limits and the initial service period.">
            <div className="grid gap-3 sm:grid-cols-2"><PlanButton selected={plan === "PREMIUM"} title="Premium" detail="Up to 40 links" onClick={() => setPlan("PREMIUM")} /><PlanButton selected={plan === "PREMIUM_PLUS"} title="Premium Plus" detail="Up to 100 links" onClick={() => setPlan("PREMIUM_PLUS")} /></div>
            <div className="mt-5 grid gap-5 sm:grid-cols-2"><Field label="Start date"><input type="date" value={startDate} onChange={(event) => { setStartDate(event.target.value); if (event.target.value) setExpiryDate(formatDateInput(addMonthsClamped(new Date(`${event.target.value}T12:00:00`), 1))); }} className={inputClass} required /></Field><Field label="Expiry date"><input type="date" value={expiryDate} min={startDate} onChange={(event) => setExpiryDate(event.target.value)} className={inputClass} required /></Field></div>
            <Toggle checked={autoRenew} onChange={setAutoRenew} title="Automatic renewal" description="Keep renewal enabled for this subscription." icon={RefreshCw} />
          </FormSection>
        </div>

        <aside className="space-y-4 xl:sticky xl:top-6">
          <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm"><div className="flex h-10 w-10 items-center justify-center rounded-xl bg-zinc-950 text-white"><ShieldCheck size={18} /></div><h2 className="mt-4 text-base font-bold text-zinc-950">Customer summary</h2><div className="mt-5 space-y-3"><Summary label="Account" value={displayName || "Not entered"} /><Summary label="Username" value={username ? `@${username}` : "Not entered"} /><Summary label="Public URL" value={slug ? `/${slug}` : "Not entered"} /><Summary label="Plan" value={plan === "PREMIUM_PLUS" ? "Premium Plus" : "Premium"} /><Summary label="Expires" value={expiryDate || "Not selected"} /></div></section>
          <button type="submit" disabled={busy} className="inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl bg-zinc-950 px-5 text-sm font-bold text-white shadow-lg shadow-zinc-950/10 transition hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-50">{busy ? <><RefreshCw size={16} className="animate-spin" />Creating customer…</> : "Create customer"}</button>
          <p className="px-2 text-center text-xs leading-5 text-zinc-400">The account, subscription, profile and audit record are created together.</p>
        </aside>
      </div>
    </form>
  );
}

function FormSection({ icon: Icon, title, description, children }: { icon: typeof UserRound; title: string; description: string; children: React.ReactNode }) { return <section className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6"><div className="flex items-start gap-3"><div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-zinc-100 text-zinc-600"><Icon size={18} /></div><div><h2 className="text-base font-bold text-zinc-950">{title}</h2><p className="mt-1 text-sm leading-5 text-zinc-500">{description}</p></div></div><div className="mt-6">{children}</div></section>; }
function Field({ label, icon: Icon, children }: { label: string; icon?: typeof Mail; children: React.ReactNode }) { return <label className="block"><span className="mb-2 flex items-center gap-2 text-sm font-semibold text-zinc-800">{Icon && <Icon size={14} className="text-zinc-400" />}{label}</span>{children}</label>; }
function Toggle({ checked, onChange, title, description, icon: Icon }: { checked: boolean; onChange: (value: boolean) => void; title: string; description: string; icon?: typeof RefreshCw }) { return <label className="mt-5 flex cursor-pointer items-start gap-3 rounded-xl border border-zinc-100 bg-zinc-50 p-4"><input type="checkbox" checked={checked} onChange={(event) => onChange(event.target.checked)} className="mt-0.5 h-4 w-4 accent-zinc-950" /><div className="min-w-0"><p className="flex items-center gap-2 text-sm font-semibold text-zinc-900">{Icon && <Icon size={14} />}{title}</p><p className="mt-1 text-xs leading-5 text-zinc-500">{description}</p></div></label>; }
function PlanButton({ selected, title, detail, onClick }: { selected: boolean; title: string; detail: string; onClick: () => void }) { return <button type="button" onClick={onClick} className={`relative min-h-24 rounded-2xl border p-4 text-left transition ${selected ? "border-zinc-950 bg-zinc-950 text-white shadow-lg shadow-zinc-950/10" : "border-zinc-200 bg-white text-zinc-950 hover:border-zinc-400"}`}><div className="flex items-center justify-between gap-3"><strong className="text-sm">{title}</strong><span className={`flex h-6 w-6 items-center justify-center rounded-full border ${selected ? "border-white bg-white text-zinc-950" : "border-zinc-200"}`}>{selected && <Check size={14} />}</span></div><p className={`mt-2 text-xs ${selected ? "text-zinc-400" : "text-zinc-500"}`}>{detail}</p></button>; }
function Summary({ label, value }: { label: string; value: string }) { return <div className="flex items-start justify-between gap-4 border-b border-zinc-100 pb-3 last:border-0 last:pb-0"><span className="text-xs font-medium text-zinc-400">{label}</span><span className="max-w-[170px] break-words text-right text-xs font-semibold text-zinc-800">{value}</span></div>; }
