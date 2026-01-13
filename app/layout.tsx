import type { Metadata, Viewport } from "next";
import { Toaster } from "sonner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Carte du Jour",
  description: "Gérez votre menu du jour facilement",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body className="min-h-screen bg-background text-foreground antialiased">
        {children}
        <Toaster
          position="bottom-right"
          toastOptions={{
            duration: 3000,
            classNames: {
              toast: "!bg-white dark:!bg-gray-900 !border !border-gray-200 dark:!border-gray-700",
              title: "!text-gray-900 dark:!text-gray-100",
              description: "!text-gray-600 dark:!text-gray-400",
              success: "!bg-green-50 dark:!bg-green-950 !border-green-200 dark:!border-green-800",
              error: "!bg-red-50 dark:!bg-red-950 !border-red-200 dark:!border-red-800",
            },
          }}
          richColors
          closeButton
        />
      </body>
    </html>
  );
}
