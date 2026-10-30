import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AppHeader } from "@/components/app-header";
import { AppRail } from "@/components/app-rail";
import { HeaderProvider } from "@/components/header-context";
import { SaveStatusProvider } from "@/components/save-status";
import { createClient } from "@/lib/supabase/server";
import type { PracticeSettings } from "@/lib/types";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TXP Pro - Treatment Planning",
  description: "Chart, plan, and sequence complex treatment cases.",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const supabase = await createClient();
  const { data } = await supabase.from("practice_settings").select("*").eq("id", 1).maybeSingle();
  const practiceSettings = data as PracticeSettings | null;
  const practiceName = practiceSettings?.name ?? "";
  const practiceAddress = practiceSettings?.address ?? "";
  // The practice's own name is the backdrop; sized so a long name still fits
  // the width instead of being clipped to its first few letters.
  const watermark = (practiceName || "TXP Pro").toUpperCase();
  const watermarkSize = Math.min(11, 120 / watermark.length);

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <TooltipProvider>
            <HeaderProvider>
              <SaveStatusProvider>
                <div
                  aria-hidden
                  className="pointer-events-none fixed inset-x-0 top-[3.5rem] z-0 overflow-hidden text-center leading-none font-semibold tracking-tight whitespace-nowrap select-none print:hidden"
                  style={{
                    fontSize: `${watermarkSize}vw`,
                    color: "var(--watermark)",
                    maskImage: "linear-gradient(to bottom, black 35%, transparent 90%)",
                  }}
                >
                  {watermark}
                </div>
                <AppRail practiceName={practiceName} practiceAddress={practiceAddress} />
                <div className="relative z-10 flex flex-1 flex-col pb-24 md:pb-0 md:pl-24 print:pl-0 print:pb-0">
                  <AppHeader practiceName={practiceName} />
                  {children}
                </div>
              </SaveStatusProvider>
            </HeaderProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
