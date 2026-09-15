type WhatsAppIconProps = { size?: number; className?: string };

/** WhatsApp brand mark, rather than a generic chat bubble icon. */
export function WhatsAppIcon({ size = 20, className }: WhatsAppIconProps) {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width={size} height={size} className={className} fill="none">
      <path fill="currentColor" d="M12 2a10 10 0 0 0-8.66 15L2 22l5.15-1.32A10 10 0 1 0 12 2Z" />
      <path fill="var(--bg-ink, #0f0f11)" d="M16.8 13.9c-.2-.1-1.18-.58-1.36-.65-.18-.07-.31-.1-.44.1-.13.2-.5.65-.61.78-.11.13-.23.15-.43.05-.2-.1-.83-.31-1.58-1-.58-.52-.97-1.16-1.08-1.35-.11-.2-.01-.3.08-.4.09-.09.2-.23.3-.34.1-.11.13-.2.2-.33.07-.13.03-.25-.02-.35-.05-.1-.44-1.06-.6-1.45-.16-.38-.32-.33-.44-.34h-.38c-.13 0-.35.05-.53.25-.18.2-.69.67-.69 1.64s.71 1.9.81 2.03c.1.13 1.4 2.14 3.4 3 .48.21.86.33 1.15.42.48.15.92.13 1.27.08.39-.06 1.18-.48 1.35-.94.17-.46.17-.85.12-.94-.05-.08-.18-.13-.38-.23Z" />
    </svg>
  );
}
