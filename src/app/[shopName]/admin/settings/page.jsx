"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../../lib/supabase";
import Sidebar from "../../../../components/Sidebar";
import { useNotification } from "@/lib/NotificationContext";

export default function SettingsPage({ params }) {
  const [shop, setShop] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [csrfToken, setCsrfToken] = useState(null);
  const router = useRouter();
  const { addNotification } = useNotification();
  const { shopName } = params;

  // Verificar autenticación al cargar la página
  useEffect(() => {
    const checkSession = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession();
        if (!session) {
          router.push("/login");
        }
      } catch (err) {
        addNotification("Error al verificar la sesión", "error");
        setLoading(false);
      }
    };

    checkSession();
  }, [router]);

  // Obtener token CSRF al cargar la página
  useEffect(() => {
    const fetchCsrfToken = async () => {
      try {
        const response = await fetch("/api/csrf-token");
        if (!response.ok) {
          const result = await response.json();
          throw new Error(result.error || "Error al obtener el token CSRF");
        }
        const result = await response.json();
        setCsrfToken(result.csrfToken);
      } catch (err) {
        addNotification(err.message, "error");
        setLoading(false);
      }
    };

    fetchCsrfToken();
  }, []);

  // Obtener datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      const shopName = params.shopName;

      try {
        const response = await fetch(`/api/shop-data?shopName=${shopName}`);
        if (!response.ok) {
          const result = await response.json();
          throw new Error(
            result.error || "Error al cargar los datos de la tienda"
          );
        }
        const result = await response.json();

        setShop(result.shop);
        setSettings(result.settings);
      } catch (err) {
        addNotification(err.message, "error");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [params]);

  const handleUpdateSettings = async (e) => {
    e.preventDefault();

    try {
      const formData = new FormData(e.target);
      const response = await fetch("/api/shop-settings", {
        method: "POST",
        headers: {
          "x-csrf-token": csrfToken,
        },
        body: formData,
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Error al guardar configuraciones");
      }

      const result = await response.json();

      addNotification("Configuraciones guardadas correctamente", "success");
    } catch (err) {
      addNotification(err.message, "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Cargando...</p>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>No se encontraron datos de la tienda.</p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar shopName={shopName} />

      {/* Contenido principal */}
      <div className="flex-1 ml-0 md:ml-64 p-6">
        <h1 className="text-3xl font-bold mb-6">
          Administrar {shop.shop_name}
        </h1>

        {/* Formulario para personalizar la tienda */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Personalizar Tienda</h2>
          <form
            onSubmit={handleUpdateSettings}
            className="bg-white p-6 rounded-lg shadow-md max-w-lg"
          >
            <input type="hidden" name="shop_id" value={shop.id} />
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Color Primario
              </label>
              <input
                type="color"
                name="primary_color"
                defaultValue={settings?.primary_color || "#2563eb"}
                className="mt-1 p-1 w-full border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Color Secundario
              </label>
              <input
                type="color"
                name="secondary_color"
                defaultValue={settings?.secondary_color || "#1f2937"}
                className="mt-1 p-1 w-full border rounded"
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                URL del Logo (opcional)
              </label>
              <input
                type="text"
                name="logo_url"
                defaultValue={settings?.logo_url || ""}
                className="mt-1 p-2 w-full border rounded"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
            >
              Guardar Configuración
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
