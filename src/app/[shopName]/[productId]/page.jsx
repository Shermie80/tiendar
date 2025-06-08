"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Navbar from "../../../components/Navbar";
import { useNotification } from "../../../lib/NotificationContext";

export default function ProductPage({ params }) {
  const [shop, setShop] = useState(null);
  const [settings, setSettings] = useState(null);
  const [product, setProduct] = useState(null);
  const [error, setError] = useState(null);
  const { addNotification } = useNotification();
  const router = useRouter();

  useEffect(() => {
    const fetchData = async () => {
      const { shopName, productId } = await params;

      try {
        const response = await fetch(
          `/api/shop-data/public?shopName=${shopName}&productId=${productId}`
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Error al cargar el producto");
        }

        setShop(result.shop);
        setSettings(result.settings);
        setProduct(result.product);
      } catch (err) {
        setError(err.message);
        addNotification(err.message, "error");
      }
    };

    fetchData();
  }, [params, addNotification]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl font-bold text-red-600">{error}</h1>
      </div>
    );
  }

  if (!shop || !settings || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: settings.secondary_color }}
    >
      <Navbar />
      {settings.logo_url && (
        <div className="w-full h-48 flex justify-center items-center">
          <img
            src={settings.logo_url}
            alt={`${shop.shop_name} banner`}
            className="max-h-full object-contain"
          />
        </div>
      )}
      <div className="container mx-auto py-12 px-4">
        <button
          onClick={() => router.push(`/${shop.shop_name}`)}
          className="mb-6 text-blue-600 hover:underline"
          style={{ color: settings.primary_color }}
        >
          ← Volver a la tienda
        </button>
        <div className="bg-white p-6 rounded-lg shadow-md">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {product.image_url && (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-96 object-contain rounded-lg"
              />
            )}
            <div>
              <h1
                className="text-3xl font-bold mb-4"
                style={{ color: settings.primary_color }}
              >
                {product.name}
              </h1>
              <p className="text-gray-600 mb-4">{product.description}</p>
              <p className="text-2xl font-bold mb-6">${product.price}</p>
              <button
                className="px-6 py-3 rounded-lg text-white font-semibold hover:opacity-90"
                style={{ backgroundColor: settings.primary_color }}
              >
                Agregar al carrito
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
