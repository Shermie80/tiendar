// app/[shopName]/page.jsx

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Navbar from "../../components/Navbar";

export default function ShopPage({ params }) {
  const [shop, setShop] = useState(null);
  const [settings, setSettings] = useState(null);
  const [products, setProducts] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const { shopName } = await params;

      try {
        const response = await fetch(
          `/api/shop-data/public?shopName=${shopName}`
        );
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || "Error al cargar la tienda");
        }

        setShop(result.shop);
        setSettings(result.settings);
        setProducts(result.products);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchData();
  }, [params]);

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl font-bold">{error}</h1>
      </div>
    );
  }

  if (!shop || !settings) {
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
      <div className="container mx-auto py-12">
        <h1
          className="text-3xl font-bold mb-6 text-center"
          style={{ color: settings.primary_color }}
        >
          Bienvenido a {shop.shop_name}
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {products.length > 0 ? (
            products.map((product) => (
              <Link
                key={product.id}
                href={`/${shop.shop_name}/${product.id}`}
                className="bg-white p-4 rounded shadow-md hover:shadow-lg transition-shadow"
              >
                {product.image_url && (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-48 object-cover rounded mb-4"
                  />
                )}
                <h3 className="text-xl font-semibold">{product.name}</h3>
                <p className="text-gray-600">{product.description}</p>
                <p className="text-lg font-bold mt-2">${product.price}</p>
              </Link>
            ))
          ) : (
            <p className="text-center col-span-full">
              No hay productos disponibles.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
