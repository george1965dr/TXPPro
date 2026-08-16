import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/theme-provider";
import { AppHeader } from "@/components/app-header";
import { HeaderProvider } from "@/components/header-context";
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
              <AppHeader
                initialPracticeName={practiceSettings?.name ?? ""}
                initialPracticeAddress={practiceSettings?.address ?? ""}
              />
              {children}
            </HeaderProvider>
          </TooltipProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
