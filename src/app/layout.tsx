import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";
import ThemeToggle from "@/components/ThemeToggle";

export const metadata: Metadata = {
  title: "FitTrack By Dajish Mohan - Client Management",
  description: "FitTrack By Dajish Mohan — Personal Trainer CRM, Diet Plan Tracking & Client Onboarding",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-theme="dark" suppressHydrationWarning>
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var saved = localStorage.getItem('fittrack_theme');
                  var theme = saved || 'dark';
                  document.documentElement.setAttribute('data-theme', theme);
                  if (theme === 'dark') {
                    document.documentElement.classList.add('dark');
                    document.documentElement.classList.remove('light');
                  } else {
                    document.documentElement.classList.add('light');
                    document.documentElement.classList.remove('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased">
        <div className="flex h-screen flex-col md:flex-row">
          {/* Desktop Sidebar */}
          <Sidebar />

          {/* Mobile Top Header with Theme Switcher */}
          <header className="md:hidden flex items-center justify-between px-4 py-3 border-b border-[var(--border)] bg-[var(--bg-secondary)] sticky top-0 z-30 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-zinc-800 border border-zinc-700 flex items-center justify-center text-white text-sm font-bold">
                ⚡
              </div>
              <div>
                <span className="font-bold text-sm tracking-tight text-[var(--text-primary)]">FitTrack</span>
                <span className="text-[10px] block text-[var(--text-muted)] font-medium">By Dajish Mohan</span>
              </div>
            </div>
            <ThemeToggle variant="pill" />
          </header>

          {/* Main Content Area */}
          <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
            <div className="max-w-7xl mx-auto p-4 md:p-6">
              {children}
            </div>
          </main>
        </div>

        {/* Mobile Bottom Navigation */}
        <MobileNav />
      </body>
    </html>
  );
}
