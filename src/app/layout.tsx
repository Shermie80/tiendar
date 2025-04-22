import type { Metadata } from "next";
import { NotificationProvider } from "@/lib/NotificationContext";
import Notification from "@/components/Notification";
import Navbar from "@/components/Navbar";
import "./globals.css";

export const metadata: Metadata = {
  title: "Tiendar",
  description: "Descripción para Tiendar",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es">
      <body>
        <NotificationProvider>
          <Navbar />
          {children}
          <Notification />
        </NotificationProvider>
      </body>
    </html>
  );
}
