import type { Metadata } from "next";
import { NotificationProvider } from "@/lib/NotificationContext";
import Notification from "@/components/Notification";
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
          {children}
          <Notification />
        </NotificationProvider>
      </body>
    </html>
  );
}
