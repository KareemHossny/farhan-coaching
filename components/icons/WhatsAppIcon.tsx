import { FaWhatsapp } from "react-icons/fa";

type WhatsAppIconProps = { size?: number; className?: string };

/** Official WhatsApp brand icon from react-icons' Font Awesome set. */
export function WhatsAppIcon({ size = 20, className }: WhatsAppIconProps) {
  return <FaWhatsapp aria-hidden="true" size={size} className={className} />;
}
