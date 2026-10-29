import type { Metadata } from "next";
import "./globals.css";
import Sidebar from "@/components/Sidebar";
import MobileNav from "@/components/MobileNav";

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
    <html lang="en">
      <head>
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="antialiased">
        <div className="flex h-screen">
          {/* Desktop Sidebar */}
          <Sidebar />

          {/* Main Content */}
          <main className="flex-1 overflow-y-auto pb-20 md:pb-0">
            <div className="max-w-7xl mx-auto p-4 md:p-6">
              {children}
            </div>
          </main>
        </div>

        {/* Mobile Bottom Nav */}
        <MobileNav />
      </body>
    </html>
  );
}
