import { LogoutButton } from "@/components/coach/LogoutButton";

export default function CoachLayout({ children }: { children: React.ReactNode }) {
  return <><div className="fixed left-4 top-4 z-50"><LogoutButton /></div>{children}</>;
}
