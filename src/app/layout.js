import { Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import { ConfirmDialogProvider } from "@/components/ConfirmDialog";
import { AlertProvider } from "@/components/Alert";

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta",
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
});

export const metadata = {
  title: "Meta Bisnis",
  description: "Platform AI untuk konsultasi ide bisnis, manajemen operasional, dan pemasaran otomatis untuk UMKM Indonesia.",
  icons: {
    icon: "data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100'><text y='75' font-size='75' fill='%232563eb'>🤖</text></svg>",
  },
};

export default function RootLayout({ children }) {
  return (
    <html lang="id">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
          rel="stylesheet"
        />
        <script src="https://cdn.tailwindcss.com"></script>
        <script src="https://cdn.jsdelivr.net/npm/chart.js"></script>
      </head>
      <body className={`${plusJakartaSans.variable} antialiased text-slate-800 bg-slate-50`}>
        <AlertProvider>
          <ConfirmDialogProvider>
            <ToastProvider>
              {children}
            </ToastProvider>
          </ConfirmDialogProvider>
        </AlertProvider>
      </body>
    </html>
  );
}
