"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "../lib/supabase";
import { useNotification } from "../lib/NotificationContext";

export default function Sidebar({ shopName }) {
  const router = useRouter();
  const { addNotification } = useNotification();

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      await fetch("/api/auth/remove-session", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      addNotification("Sesión cerrada correctamente", "success");
      router.push("/login");
    } catch (err) {
      addNotification("Error al cerrar sesión: " + err.message, "error");
    }
  };

  return (
    <div className="fixed top-0 left-0 h-full w-64 bg-gray-800 text-white p-6">
      <h2 className="text-2xl font-bold mb-6">{shopName}</h2>
      <nav className="flex flex-col space-y-4">
        <Link
          href={`/${shopName}/admin`}
          className="text-lg hover:bg-gray-700 p-2 rounded"
        >
          Escritorio
        </Link>
        <Link
          href={`/${shopName}/admin/products`}
          className="text-lg hover:bg-gray-700 p-2 rounded"
        >
          Productos
        </Link>
        <Link
          href={`/${shopName}/admin/settings`}
          className="text-lg hover:bg-gray-700 p-2 rounded"
        >
          Personalizar Tienda
        </Link>
      </nav>
      <div className="absolute bottom-6 left-6 right-6 space-y-4">
        <Link
          href={`/${shopName}`}
          className="block w-full bg-blue-600 text-white text-center p-2 rounded hover:bg-blue-700"
        >
          Ver Tienda
        </Link>
        <button
          onClick={handleLogout}
          className="w-full bg-red-600 text-white p-2 rounded hover:bg-red-600"
        >
          Cerrar Sesión
        </button>
      </div>
    </div>
  );
}
