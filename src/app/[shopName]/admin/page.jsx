"use client";

import { useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { useShop } from "@/lib/ShopContext";

export default function AdminPage({ params }) {
  const { shopData, fetchShopData, loading } = useShop();
  const { shopName } = params;

  useEffect(() => {
    fetchShopData(shopName);
  }, [shopName, fetchShopData]);

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

  const { shop } = shopData;

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar shopName={shopName} />

      {/* Contenido principal */}
      <div className="flex-1 ml-0 md:ml-64 p-6">
        <h1 className="text-3xl font-bold mb-6">
          Administrar {shop.shop_name}
        </h1>

        {/* Escritorio */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Escritorio</h2>
          <div className="bg-white p-6 rounded-lg shadow-md">
            <p className="text-lg text-gray-600">
              ¡Bienvenido al escritorio! Aquí pronto verás notificaciones y
              actualizaciones importantes. 🚀
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
