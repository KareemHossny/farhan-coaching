export function whatsappUrl(phone: string, message: string) {
  const normalized = phone.replace(/\D/g, "").replace(/^0/, "20");
  return `https://wa.me/${normalized}?text=${encodeURIComponent(message)}`;
}
