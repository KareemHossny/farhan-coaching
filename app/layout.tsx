import type { Metadata } from "next";
import { Cairo } from "next/font/google";
import "./globals.css";
import { AppToaster } from "@/components/ui/sonner";

const cairo = Cairo({ subsets: ["arabic", "latin"], display: "swap", variable: "--font-cairo" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000"),
  title: "أحمد فرحان | تدريب ولياقة أونلاين",
  description: "تدريب وتمرين وتغذية مصممة لهدفك مع متابعة حقيقية.",
  alternates: { canonical: "/" },
  icons: { icon: "/images/logo.png", shortcut: "/images/logo.png" },
  openGraph: {
    type: "website", locale: "ar_EG", title: "أحمد فرحان | تدريب ولياقة أونلاين",
    description: "خطة تدريب وتغذية مناسبة لهدفك مع متابعة شخصية.", url: "/", siteName: "أحمد فرحان للتدريب أونلاين",
    images: [{ url: "/images/coach/coach-hero.jpg", width: 1200, height: 630, alt: "أحمد فرحان داخل الجيم" }],
  },
  twitter: { card: "summary_large_image", title: "أحمد فرحان | تدريب ولياقة أونلاين", description: "خطة تدريب وتغذية مناسبة لهدفك مع متابعة شخصية.", images: ["/images/coach/coach-hero.jpg"] },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ar" dir="rtl" data-scroll-behavior="smooth"><body className={`${cairo.variable} antialiased`}>{children}<AppToaster /></body></html>;
}
