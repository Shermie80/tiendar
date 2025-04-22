"use client";

import { useEffect } from "react";
import Sidebar from "../../../../components/Sidebar";
import { useNotification } from "@/lib/NotificationContext";
import { useShop } from "@/lib/ShopContext";

export default function SettingsPage({ params }) {
  const { shopData, fetchShopData, loading, csrfToken } = useShop();
  const { addNotification } = useNotification();
  const { shopName } = params;

  useEffect(() => {
    fetchShopData(shopName);
  }, [shopName, fetchShopData]);

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

      // Actualizar el estado global con las nuevas configuraciones
      shopData.settings = {
        primary_color: formData.get("primary_color"),
        secondary_color: formData.get("secondary_color"),
        logo_url: formData.get("logo_url") || null,
      };

      addNotification("Configuraciones guardadas correctamente", "success");
    } catch (err) {
      addNotification(err.message, "error");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <div className="flex flex-col items-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          <p className="mt-4 text-lg text-gray-700">
            Cargando datos de la tienda...
          </p>
        </div>
      </div>
    );
  }

  if (!shopData || !shopData.shop) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>No se encontraron datos de la tienda.</p>
      </div>
    );
  }

  const { shop, settings } = shopData;

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
