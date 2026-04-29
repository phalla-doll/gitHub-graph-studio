import type {Metadata} from 'next';
import './globals.css';
import { Geist } from "next/font/google";
import { cn } from "@/lib/utils";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/sonner";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

export const metadata: Metadata = {
  title: 'GitHub Graph Studio',
  description: 'Design your GitHub contribution graph visually',
};

export default function RootLayout({children}: {children: React.ReactNode}) {
  return (
    <html lang="en" className={cn("font-sans antialiased", geist.variable)}>
      <body suppressHydrationWarning>
        <TooltipProvider delay={0}>
          {children}
        </TooltipProvider>
        <Toaster position="top-center" />
      </body>
    </html>
  );
}
