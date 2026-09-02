import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Check,
  ChevronRight,
  Globe2,
  Link2,
  MapPinned,
  MousePointerClick,
  Route,
  ShieldCheck,
  Smartphone,
  Sparkles,
  Zap,
} from "lucide-react";

import { PLAN_CATALOG, PLAN_ORDER, type PlanId } from "@/features/plans/plan-catalog";

import styles from "./landing-page.module.css";

const contactEmail = process.env.NEXT_PUBLIC_LINKZZZ_CONTACT_EMAIL ?? "hello@linkzzz.com";
const contactHref = `mailto:${contactEmail}?subject=${encodeURIComponent("Linkzzz access request")}`;

const productFeatures = [
  {
    icon: Smartphone,
    eyebrow: "Smart destinations",
    title: "Open the right place, not just another browser tab.",
    copy: "Send people toward the best app or web destination for their device, with a safe fallback when an app cannot open.",
    accent: "violet",
  },
  {
    icon: MapPinned,
    eyebrow: "Geo routing",
    title: "One URL that adapts to where your audience is.",
    copy: "Route visitors by country, keep a default experience, or block traffic where a campaign should not run.",
    accent: "lime",
  },
  {
    icon: ShieldCheck,
    eyebrow: "Traffic Shield",
    title: "Control what reaches the destination before it gets there.",
    copy: "Apply server-side traffic rules while keeping verified previews and real visitors on a deliberate path.",
    accent: "blue",
  },
] as const;

const platformNames = ["Instagram", "YouTube", "Spotify", "Telegram", "WhatsApp", "Custom URL"];

export default function LandingPage() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerInner}>
          <a href="#top" className={styles.brand} aria-label="Linkzzz home">
            <BrandMark />
            <span>LINKZZZ</span>
          </a>

          <nav className={styles.desktopNav} aria-label="Main navigation">
            <a href="#product">Product</a>
            <a href="#how-it-works">How it works</a>
            <a href="#plans">Plans</a>
          </nav>

          <div className={styles.headerActions}>
            <a href="#plans" className={styles.mobilePlansLink}>
              Plans
            </a>
            <Link href="/login" className={styles.loginLink}>
              Login
              <ArrowRight size={15} aria-hidden="true" />
            </Link>
          </div>
        </div>
      </header>

      <main id="top">
        <section className={styles.hero} aria-labelledby="hero-heading">
          <div className={styles.heroGlow} aria-hidden="true" />
          <div className={styles.shell}>
            <div className={styles.heroGrid}>
              <div className={styles.heroCopy}>
                <div className={styles.eyebrow}>
                  <span className={styles.eyebrowDot} />
                  Smart Links for real campaigns
                </div>

                <h1 id="hero-heading">
                  One Smart Link.
                  <span>Every move accounted for.</span>
                </h1>

                <p className={styles.heroLead}>
                  Build polished landing pages or direct routes, send every visitor to the right destination,
                  and understand what happens after the click.
                </p>

                <div className={styles.heroActions}>
                  <a href="#product" className={styles.primaryButton}>
                    Explore the product
                    <ArrowRight size={17} aria-hidden="true" />
                  </a>
                  <Link href="/login" className={styles.secondaryButton}>
                    Sign in
                  </Link>
                </div>

                <div className={styles.heroProof} aria-label="Core Linkzzz capabilities">
                  <span><Check size={14} aria-hidden="true" /> Landing pages</span>
                  <span><Check size={14} aria-hidden="true" /> Direct Smart Links</span>
                  <span><Check size={14} aria-hidden="true" /> No feature lockouts</span>
                </div>
              </div>

              <HeroProductVisual />
            </div>
          </div>
        </section>

        <section className={styles.platformStrip} aria-label="Supported destination examples">
          <div className={styles.shell}>
            <p>Route to the places your audience already uses</p>
            <div className={styles.platformList}>
              {platformNames.map((platform) => (
                <span key={platform}>{platform}</span>
              ))}
            </div>
          </div>
        </section>

        <section id="product" className={styles.productSection} aria-labelledby="product-heading">
          <div className={styles.shell}>
            <SectionHeading
              label="Built beyond link-in-bio"
              title="The click is only the beginning."
              copy="Linkzzz treats every public URL as a configurable system: content, routing, protection and measurement live together instead of being patched across separate tools."
              id="product-heading"
            />

            <div className={styles.featureGrid}>
              {productFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <article key={feature.title} className={`${styles.featureCard} ${styles[feature.accent]}`}>
                    <div className={styles.featureIcon}><Icon size={20} aria-hidden="true" /></div>
                    <p className={styles.cardEyebrow}>{feature.eyebrow}</p>
                    <h3>{feature.title}</h3>
                    <p>{feature.copy}</p>
                    <div className={styles.featureSignal} aria-hidden="true">
                      <span />
                      <span />
                      <span />
                    </div>
                  </article>
                );
              })}
            </div>

            <div className={styles.analyticsPanel}>
              <div className={styles.analyticsCopy}>
                <div className={styles.iconLabel}><BarChart3 size={18} aria-hidden="true" /> Analytics</div>
                <h3>See the route, not just the number.</h3>
                <p>
                  Track views, clicks and unique visitors across every Smart Link. Internal server-side analytics remain
                  reliable even when a direct route cannot wait for a browser pixel.
                </p>
                <div className={styles.metricPills}>
                  <span>Views</span><span>Clicks</span><span>CTR</span><span>Visitors</span>
                </div>
              </div>
              <MiniChart />
            </div>
          </div>
        </section>

        <section id="how-it-works" className={styles.workflowSection} aria-labelledby="workflow-heading">
          <div className={styles.shell}>
            <SectionHeading
              label="One controlled flow"
              title="From click to destination in three clear moves."
              copy="Configure once. Linkzzz evaluates the request, chooses the correct route and records the result without scattering logic across your stack."
              id="workflow-heading"
              light
            />

            <div className={styles.workflowGrid}>
              <WorkflowStep
                number="01"
                icon={Link2}
                title="Create the Smart Link"
                copy="Choose a visual Landing Page or a fast Direct Smart Link, then give it one memorable public URL."
              />
              <WorkflowStep
                number="02"
                icon={Route}
                title="Set the intelligence"
                copy="Add destination, deeplink, Geo, Shield and tracking rules with safe defaults already in place."
              />
              <WorkflowStep
                number="03"
                icon={MousePointerClick}
                title="Publish and learn"
                copy="Share one Smart Link, monitor real traffic and refine the experience from the same workspace."
              />
            </div>

            <div className={styles.capabilityRail}>
              <div><Globe2 size={18} aria-hidden="true" /><span>Custom domains</span></div>
              <div><Bot size={18} aria-hidden="true" /><span>Crawler-aware previews</span></div>
              <div><Zap size={18} aria-hidden="true" /><span>Smart app opening</span></div>
              <div><Sparkles size={18} aria-hidden="true" /><span>Visual page builder</span></div>
            </div>
          </div>
        </section>

        <section id="plans" className={styles.plansSection} aria-labelledby="plans-heading">
          <div className={styles.shell}>
            <SectionHeading
              label="Simple capacity-based plans"
              title="Same product. More room to move."
              copy="Every plan includes the core Linkzzz toolkit. Pick the Smart Link capacity that matches the number of campaigns you manage."
              id="plans-heading"
            />

            <div className={styles.planGrid}>
              {PLAN_ORDER.map((planId) => (
                <PlanCard key={planId} planId={planId} />
              ))}
            </div>

            <p className={styles.planNote}>
              Accounts are currently provisioned by the Linkzzz team. There is no public self-service checkout.
            </p>
          </div>
        </section>

        <section className={styles.finalCta} aria-labelledby="final-cta-heading">
          <div className={styles.finalCtaGlow} aria-hidden="true" />
          <div className={styles.shell}>
            <div className={styles.finalCtaInner}>
              <div>
                <p className={styles.finalLabel}>Ready when your campaign is</p>
                <h2 id="final-cta-heading">Give every click a better next step.</h2>
              </div>
              <div className={styles.finalActions}>
                <a href={contactHref} className={styles.primaryButton}>
                  Request access <ArrowRight size={17} aria-hidden="true" />
                </a>
                <Link href="/login" className={styles.darkSecondaryButton}>Existing customer login</Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className={styles.footer}>
        <div className={styles.shell}>
          <div className={styles.footerInner}>
            <a href="#top" className={styles.brand} aria-label="Back to the top">
              <BrandMark />
              <span>LINKZZZ</span>
            </a>
            <p>Smart Links, built for the full journey.</p>
            <div className={styles.footerLinks}>
              <a href="#product">Product</a>
              <a href="#plans">Plans</a>
              <Link href="/login">Login</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

function BrandMark() {
  return (
    <span className={styles.brandMark} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

function HeroProductVisual() {
  return (
    <div className={styles.heroVisual} aria-label="Linkzzz smart routing product preview">
      <div className={styles.visualChrome}>
        <span /><span /><span />
        <p>linkzzz.com/your-link</p>
        <ShieldCheck size={14} aria-hidden="true" />
      </div>

      <div className={styles.visualBody}>
        <div className={styles.routeCard}>
          <div className={styles.routeHeader}>
            <div>
              <p>LIVE ROUTE</p>
              <h2>Launch campaign</h2>
            </div>
            <span className={styles.liveBadge}><i /> Published</span>
          </div>

          <div className={styles.routeFlow}>
            <RouteNode icon={MousePointerClick} label="Visitor click" detail="Mobile · Serbia" />
            <div className={styles.routeLine}><span /></div>
            <RouteNode icon={ShieldCheck} label="Traffic verified" detail="Shield passed" active />
            <div className={styles.routeLine}><span /></div>
            <RouteNode icon={Smartphone} label="Open in app" detail="Smart deeplink" />
          </div>
        </div>

        <div className={styles.phonePreview}>
          <div className={styles.phoneSpeaker} />
          <div className={styles.profileAvatar}>LZ</div>
          <strong>Your next move</strong>
          <small>Everything worth finding, in one place.</small>
          <div className={styles.phoneLink}>Latest release <ChevronRight size={13} /></div>
          <div className={styles.phoneLink}>Watch the campaign <ChevronRight size={13} /></div>
          <div className={styles.phoneLink}>Get in touch <ChevronRight size={13} /></div>
        </div>

        <div className={styles.floatingMetric}>
          <span><BarChart3 size={15} aria-hidden="true" /> Today</span>
          <strong>18.4%</strong>
          <small>click-through rate</small>
        </div>
      </div>
    </div>
  );
}

function RouteNode({
  icon: Icon,
  label,
  detail,
  active = false,
}: {
  icon: typeof Link2;
  label: string;
  detail: string;
  active?: boolean;
}) {
  return (
    <div className={`${styles.routeNode} ${active ? styles.routeNodeActive : ""}`}>
      <div><Icon size={17} aria-hidden="true" /></div>
      <span><strong>{label}</strong><small>{detail}</small></span>
      <Check size={15} aria-hidden="true" />
    </div>
  );
}

function SectionHeading({
  label,
  title,
  copy,
  id,
  light = false,
}: {
  label: string;
  title: string;
  copy: string;
  id: string;
  light?: boolean;
}) {
  return (
    <div className={`${styles.sectionHeading} ${light ? styles.sectionHeadingLight : ""}`}>
      <p>{label}</p>
      <h2 id={id}>{title}</h2>
      <span>{copy}</span>
    </div>
  );
}

function MiniChart() {
  const bars = [31, 46, 39, 64, 52, 74, 68, 87, 78, 96, 89, 112];
  return (
    <div className={styles.chartCard} aria-label="Illustrative traffic trend chart">
      <div className={styles.chartHeader}>
        <div><span>Smart Link performance</span><strong>24,892</strong></div>
        <span className={styles.chartGrowth}>+18.4%</span>
      </div>
      <div className={styles.chartPlot} aria-hidden="true">
        {bars.map((height, index) => <span key={`${height}-${index}`} style={{ height: `${height}px` }} />)}
      </div>
      <div className={styles.chartLegend}><span>Last 12 days</span><span>Live data</span></div>
    </div>
  );
}

function WorkflowStep({
  number,
  icon: Icon,
  title,
  copy,
}: {
  number: string;
  icon: typeof Link2;
  title: string;
  copy: string;
}) {
  return (
    <article className={styles.workflowCard}>
      <div className={styles.workflowTop}><span>{number}</span><Icon size={21} aria-hidden="true" /></div>
      <h3>{title}</h3>
      <p>{copy}</p>
    </article>
  );
}

function PlanCard({ planId }: { planId: PlanId }) {
  const plan = PLAN_CATALOG[planId];
  const featured = planId === "PRO";

  return (
    <article className={`${styles.planCard} ${featured ? styles.planCardFeatured : ""}`}>
      {featured && <span className={styles.popularBadge}>Most popular</span>}
      <div className={styles.planTop}>
        <p>{plan.name}</p>
        <div><strong>${plan.priceUsdMonthly}</strong><span>/ month</span></div>
        <small>{plan.description}</small>
      </div>
      <div className={styles.planDivider} />
      <ul>
        <li><Check size={16} aria-hidden="true" /><span><strong>{plan.smartLinkDisplay}</strong> Smart Links</span></li>
        <li><Check size={16} aria-hidden="true" /><span>Up to <strong>{plan.pageLinkLimit}</strong> links per Landing Page</span></li>
        <li><Check size={16} aria-hidden="true" /><span>All core routing, analytics and design tools</span></li>
      </ul>
      <a href={contactHref} className={featured ? styles.planPrimaryButton : styles.planButton}>
        Request access <ArrowRight size={15} aria-hidden="true" />
      </a>
    </article>
  );
}
