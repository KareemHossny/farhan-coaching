import Image from "next/image";
import { ArrowLeft, ArrowDownLeft, Check, ChevronDown, Facebook, Instagram, Music2, Play, Quote, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ContactForm } from "@/components/landing/ContactForm";
import { MobileNav } from "@/components/landing/MobileNav";
import { TransformationsGallery } from "@/components/landing/TransformationsGallery";
import { landingContent } from "@/lib/content/landing-content";
import { whatsappUrl } from "@/lib/whatsapp";
import { WhatsAppIcon } from "@/components/icons/WhatsAppIcon";

const socialIcons = { Instagram, Facebook, TikTok: Music2, WhatsApp: WhatsAppIcon };

export default function MarketingPage() {
  const { nav, coach, hero, about, method, pricing, transformations, faq, contact, footer } = landingContent;

  return (
    <main className="marketing-shell min-h-screen overflow-x-clip bg-[var(--bg-ink)] text-[var(--text-primary)]">
      <header className="site-header"><div className="container flex h-[72px] items-center justify-between">
        <a href="#home" aria-label={coach.name} className="shrink-0"><Image src={nav.logo.url} alt={nav.logo.alt} width={150} height={52} className="h-11 w-auto object-contain" priority /></a>
        <nav className="hidden items-center gap-8 md:flex" aria-label="التنقل الرئيسي">{nav.links.map((link) => <a key={link.href} href={link.href} className="nav-link">{link.label}</a>)}</nav>
        <a href={whatsappUrl(nav.whatsappNumber, nav.ctaMessage)} target="_blank" rel="noreferrer" className="hidden md:block"><Button className="cta-button h-10 px-5">{nav.ctaText}<ArrowLeft size={16} /></Button></a>
        <MobileNav links={nav.links} ctaText={nav.ctaText} whatsappNumber={nav.whatsappNumber} ctaMessage={nav.ctaMessage} />
      </div></header>

      <section id="home" className="landing-hero hero-section">
        <div className="hero-photo"><Image src={hero.heroPhotoUrl} alt={hero.heroPhotoAlt} fill priority sizes="(max-width: 767px) 100vw, 64vw" className="object-cover" /></div>
        <div className="hero-shade" />
        <div className="container relative z-10 grid min-h-[calc(100svh-72px)] items-end gap-8 pb-8 pt-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center lg:pb-16 lg:[direction:ltr]">
          <div className="hero-copy max-w-3xl lg:[direction:rtl]">
            <div className="hero-kicker"><span className="hero-kicker-dot" />{hero.eyebrow}<span className="hero-kicker-line" /></div>
            <h1 className="display-title mt-5 max-w-3xl text-[clamp(2.65rem,12vw,5rem)] leading-[1.08] sm:text-7xl lg:text-[clamp(3.6rem,6.5vw,6.5rem)]">{hero.headline}</h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-[var(--text-secondary)] sm:mt-6 sm:text-xl">{hero.subheadline}</p>
            <div className="mt-7 flex flex-col gap-3 sm:mt-8 sm:flex-row">
              <a className="w-full sm:w-auto" href={whatsappUrl(hero.whatsappNumber, hero.ctaMessage)} target="_blank" rel="noreferrer"><Button size="lg" className="cta-button w-full px-8 sm:w-auto">{hero.ctaText}<WhatsAppIcon size={18} /></Button></a>
              <a href="#transformations" className="secondary-button inline-flex min-h-11 items-center justify-center gap-2 rounded-sm px-7 py-3 text-sm font-bold">شوف النتائج <Play size={15} fill="currentColor" /></a>
            </div>
            <div className="hero-micro-proof"><Sparkles size={15} /><span>متابعة شخصية · خطة على مقاسك · نتائج حقيقية</span></div>
          </div>
          <div className="hero-spacer hidden lg:block" />
        </div>
        <div className="container relative z-10 pb-7 lg:pb-10"><div className="stats-strip">{hero.stats.map((stat) => <div key={stat.label} className="stat-item"><strong>{stat.value}</strong><span>{stat.label}</span></div>)}</div></div>
        <a href="#method" className="hero-scroll-cue hidden lg:flex" aria-label="اكتشف طريقة التدريب"><span>اكتشف</span><ArrowDownLeft size={16} /></a>
      </section>

      <section className="proof-strip" aria-label="مميزات التدريب"><div className="container grid grid-cols-1 divide-y divide-[var(--border-hairline)] sm:grid-cols-3 sm:divide-x sm:divide-y-0 sm:[direction:ltr]">
        {hero.stats.map((stat, index) => <div key={stat.label} className="proof-strip-item sm:[direction:rtl]"><span className="proof-strip-index">0{index + 1}</span><div><strong>{stat.label}</strong><p>{index === 0 ? "خطة مبنية على هدفك وحياتك" : index === 1 ? "تعديل مستمر حسب تقدمك" : "شغل واضح تقدر تلتزم بيه"}</p></div></div>)}
      </div></section>

      <section id="method" className="method-section section-padding"><div className="container">
        <div className="section-heading flex flex-col justify-between gap-6 lg:flex-row lg:items-end"><div><span className="eyebrow">{method.eyebrow}</span><h2 className="section-title mt-4">{method.title}</h2></div><p className="max-w-xs text-sm leading-7 text-[var(--text-muted)]">مش بنبيع لك جدول جاهز. بنبني معاك نظام تقدر تكمل عليه.</p></div>
        <div className="method-grid mt-12">{method.steps.map((step, index) => <article key={step.number} className={`method-card method-card-${index + 1}`}><div className="flex items-start justify-between"><span className="step-number">{step.number}</span><ArrowLeft size={20} className="text-[var(--accent)]" /></div><h3 className="mt-12 text-2xl font-extrabold">{step.title}</h3><p className="mt-3 leading-7 text-[var(--text-muted)]">{step.text}</p></article>)}</div>
      </div></section>

      <section id="about" className="about-section section-padding"><div className="container grid items-center gap-12 lg:grid-cols-[0.9fr_1.1fr] lg:gap-20">
        <div className="about-image-wrap"><div className="about-image"><Image src={about.aboutPhotoUrl} alt={about.aboutPhotoAlt} fill sizes="(max-width: 1024px) 100vw, 45vw" className="object-cover object-center" /></div><div className="image-stamp"><span>TRAIN<br />SMART</span></div><div className="about-photo-label">{coach.name}<span>{coach.role}</span></div></div>
        <div className="about-copy"><span className="eyebrow">{about.eyebrow}</span><h2 className="section-title mt-4">{about.title}</h2><p className="mt-6 max-w-xl text-lg leading-8 text-[var(--text-secondary)]">{about.description}</p><ul className="mt-8 space-y-4">{about.credentials.map((item) => <li key={item} className="flex items-center gap-3 font-bold"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-[var(--bg-ink)]"><Check size={15} strokeWidth={3} /></span>{item}</li>)}</ul></div>
      </div></section>

      <section id="transformations" className="transformation-section section-padding border-y border-[var(--border-hairline)]"><div className="container"><div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end"><div><span className="eyebrow">{transformations.eyebrow}</span><h2 className="section-title mt-4">{transformations.title}</h2></div><p className="max-w-sm text-[var(--text-muted)] sm:text-left">{transformations.subtitle}</p></div><TransformationsGallery items={transformations.items} /></div></section>

      <section id="pricing" className="pricing-section section-padding"><div className="container"><div className="pricing-intro mx-auto max-w-2xl text-center"><span className="eyebrow">{pricing.eyebrow}</span><h2 className="section-title mt-4">{pricing.title}</h2><p className="mt-4 text-[var(--text-muted)]">{pricing.subtitle}</p></div><div className="mt-12 grid gap-5 lg:grid-cols-2 lg:mx-auto lg:max-w-4xl">{pricing.plans.map((plan, index) => <Card key={plan.name} className={`pricing-card ${plan.highlighted ? "pricing-card-featured" : ""}`}><CardHeader><div className="pricing-card-topline"><span>0{index + 1} / متابعة</span>{plan.highlighted && <span className="pricing-badge">الأكثر طلبًا</span>}</div><div className="flex items-start justify-between gap-3"><CardTitle className="mt-5 text-2xl font-extrabold text-[var(--text-primary)]">{plan.name}</CardTitle></div><p className="mt-6 text-4xl font-black text-[var(--accent)]">{plan.price}</p><p className="text-sm text-[var(--text-muted)]">{plan.duration}</p></CardHeader><CardContent><ul className="space-y-4 border-t border-[var(--border-hairline)] pt-6 text-sm text-[var(--text-secondary)]">{plan.features.map((feature) => <li key={feature} className="flex gap-3"><Check size={17} className="shrink-0 text-[var(--accent)]" />{feature}</li>)}</ul><a href={whatsappUrl(pricing.whatsappNumber, `${pricing.whatsappMessage} ${plan.name}`)} target="_blank" rel="noreferrer" className="mt-8 block"><Button className={plan.highlighted ? "cta-button w-full" : "secondary-button w-full"}>{plan.ctaText}<WhatsAppIcon size={17} /></Button></a></CardContent></Card>)}</div><p className="mt-8 text-center text-sm text-[var(--text-muted)]">{pricing.note}</p></div></section>

      <section className="faq-section section-padding border-y border-[var(--border-hairline)] bg-[var(--surface-quiet)]"><div className="container grid gap-10 lg:grid-cols-[0.75fr_1fr]"><div><span className="eyebrow">{faq.eyebrow}</span><h2 className="section-title mt-4">{faq.title}</h2><div className="mt-8 flex items-center gap-3 text-[var(--text-muted)]"><Quote size={28} className="text-[var(--accent)]" /><span className="text-sm">القرار الصح بيبدأ بمعلومة واضحة.</span></div></div><div className="divide-y divide-[var(--border-hairline)] border-y border-[var(--border-hairline)]">{faq.items.map((item) => <details key={item.question} className="group py-5"><summary className="flex cursor-pointer list-none items-center justify-between gap-4 font-bold"><span>{item.question}</span><ChevronDown size={18} className="shrink-0 text-[var(--accent)] transition group-open:rotate-180" /></summary><p className="pt-4 leading-7 text-[var(--text-muted)]">{item.answer}</p></details>)}</div></div></section>

      <section id="contact" className="contact-section section-padding"><div className="container grid gap-10 lg:grid-cols-[0.85fr_1fr] lg:items-start"><div><span className="eyebrow">{contact.eyebrow}</span><h2 className="section-title mt-4">{contact.title}</h2><p className="mt-6 max-w-lg text-lg leading-8 text-[var(--text-secondary)]">{contact.description}</p><a href={whatsappUrl(contact.whatsappNumber, contact.whatsappMessage)} target="_blank" rel="noreferrer" className="mt-8 inline-flex"><Button size="lg" className="cta-button">{contact.whatsappText}<WhatsAppIcon size={18} /></Button></a><p className="mt-5 text-sm text-[var(--text-muted)]">أو ابعت بياناتك، والكابتن هيرد عليك بنفسه.</p></div><ContactForm content={contact} /></div></section>

      <footer className="border-t border-[var(--border-hairline)] py-10"><div className="container flex flex-col gap-8 md:flex-row md:items-center md:justify-between"><div><Image src={footer.logo.url} alt={footer.logo.alt} width={130} height={44} className="h-10 w-auto object-contain" /><p className="mt-3 text-sm text-[var(--text-muted)]">{coach.name} · {footer.tagline}</p></div><nav className="flex flex-wrap gap-5 text-sm text-[var(--text-muted)]">{footer.quickLinks.map((link) => <a key={link.href} href={link.href} className="transition hover:text-[var(--accent)]">{link.label}</a>)}</nav><div className="flex gap-3">{Object.entries(footer.social).filter(([, url]) => !url.includes("[placeholder]")).map(([name, url]) => { const Icon = socialIcons[name as keyof typeof socialIcons]; return Icon ? <a key={name} href={url} aria-label={name} target="_blank" rel="noreferrer" className="rounded-sm border border-[var(--border-hairline)] p-2 text-[var(--text-muted)] transition hover:border-[var(--accent)] hover:text-[var(--accent)]"><Icon size={18} /></a> : null; })}</div></div><div className="container mt-8 border-t border-[var(--border-hairline)] pt-6 text-xs text-[var(--text-muted)]">{footer.copyrightText}</div></footer>
      <a className="fixed bottom-4 left-4 z-40 flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-3 text-sm font-black text-[var(--bg-ink)] shadow-xl transition hover:bg-[var(--accent-bright)] sm:hidden" href={whatsappUrl(nav.whatsappNumber, nav.ctaMessage)} target="_blank" rel="noreferrer"><WhatsAppIcon size={18} /> واتساب</a>
    </main>
  );
}
