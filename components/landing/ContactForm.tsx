"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";
import { submitLead, type LeadActionState } from "@/app/actions/leads";
import type { LandingContent } from "@/lib/content/landing-content";

export function ContactForm({ content }: { content: LandingContent["contact"] }) {
  const [state, action, pending] = useActionState<LeadActionState, FormData>(submitLead, {});
  useEffect(() => {
    if (state.success) {
      document.querySelector<HTMLFormElement>("#lead-form")?.reset();
      toast.success(content.successText);
    }
    if (state.error) toast.error(state.error);
  }, [content.successText, state.error, state.success]);
  return (
    <form id="lead-form" action={action} className="panel p-5 sm:p-7">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="block text-sm font-bold text-[var(--text-secondary)]">{content.nameLabel}<input name="name" required placeholder={content.namePlaceholder} className="field mt-2" /></label>
        <label className="block text-sm font-bold text-[var(--text-secondary)]">{content.phoneLabel}<input name="phone" required type="tel" placeholder={content.phonePlaceholder} dir="ltr" className="field mt-2 text-left" /></label>
      </div>
      <label className="mt-4 block text-sm font-bold text-[var(--text-secondary)]">{content.messageLabel}<textarea name="message" rows={4} placeholder={content.messagePlaceholder} className="field mt-2 resize-none" /></label>
      {state.error && <p className="mt-4 text-sm text-red-400" role="alert">{state.error}</p>}
      {state.success && <p className="mt-4 text-sm text-[var(--accent)]" role="status">{content.successText}</p>}
      <button disabled={pending} className="mt-5 w-full rounded-sm bg-[var(--accent)] px-4 py-3.5 font-extrabold text-[var(--bg-ink)] transition hover:bg-[var(--accent-bright)] disabled:opacity-60">{pending ? "جاري الإرسال..." : content.submitText}</button>
    </form>
  );
}
