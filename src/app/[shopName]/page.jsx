// app/[shopName]/page.jsx

"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import Navbar from "../../components/Navbar";

export default function ShopPage({ params }) {
  const [shop, setShop] = useState(null);
  const [settings, setSettings] = useState(null);
  const [products, setProducts] = useState([]);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Obtener datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      // Esperar a que params se resuelva
      const { shopName } = await params;

      // Buscar la tienda en la base de datos
      const { data: shopData, error: shopError } = await supabase
        .from("shops")
        .select("*")
        .eq("shop_name", shopName)
        .single();

      if (shopError || !shopData) {
        setShop(null);
        return;
      }

      setShop(shopData);

      // Obtener las configuraciones de la tienda
      const { data: settingsData, error: settingsError } = await supabase
        .from("shop_settings")
        .select("*")
        .eq("shop_id", shopData.id)
        .single();

      if (settingsError && settingsError.code !== "PGRST116") {
        console.error("Error fetching shop settings:", settingsError);
      }

      setSettings(
        settingsData || { primary_color: "#2563eb", secondary_color: "#f3f4f6" }
      );

      // Obtener los productos de la tienda
      const { data: productsData, error: productsError } = await supabase
        .from("products")
        .select("*")
        .eq("shop_id", shopData.id);

      if (productsError) {
        console.error("Error fetching products:", productsError);
      }

      setProducts(productsData || []);
    };

    fetchData();
  }, [params]);

  // Funciones del carrito
  const addToCart = (product) => {
    setCart((prevCart) => {
      const existingProduct = prevCart.find((item) => item.id === product.id);
      if (existingProduct) {
        return prevCart.map((item) =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prevCart, { ...product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.id !== productId));
  };

  const updateQuantity = (productId, quantity) => {
    if (quantity <= 0) {
      removeFromCart(productId);
      return;
    }
    setCart((prevCart) =>
      prevCart.map((item) =>
        item.id === productId ? { ...item, quantity: parseInt(quantity) } : item
      )
    );
  };

  const getTotalPrice = () => {
    return cart
      .reduce((total, item) => total + item.price * item.quantity, 0)
      .toFixed(2);
  };

  if (!shop) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl font-bold">Tienda no encontrada</h1>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ backgroundColor: settings?.secondary_color || "#f3f4f6" }}
    >
      <Navbar />
      {/* Banner */}
      <div
        className="relative h-64 flex items-center justify-center"
        style={{ backgroundColor: settings?.primary_color || "#2563eb" }}
      >
        {settings?.logo_url ? (
          <img src={settings.logo_url} alt="Logo" className="h-24" />
        ) : (
          <h1 className="text-4xl font-bold text-white">{shop.shop_name}</h1>
        )}
      </div>

      {/* Botón del carrito */}
      <div className="container mx-auto py-6">
        <button
          onClick={() => setIsCartOpen(!isCartOpen)}
          className="fixed top-20 right-4 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg hover:bg-blue-700"
        >
          Carrito ({cart.length})
        </button>

        {/* Carrito lateral */}
        {isCartOpen && (
          <div className="fixed top-0 right-0 w-80 h-full bg-white shadow-lg p-6 overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4">Tu Carrito</h2>
            {cart.length > 0 ? (
              <>
                {cart.map((item) => (
                  <div
                    key={item.id}
                    className="flex items-center justify-between mb-4"
                  >
                    <div>
                      <h3 className="text-lg font-semibold">{item.name}</h3>
                      <p className="text-gray-600">
                        ${item.price} x {item.quantity}
                      </p>
                      <input
                        type="number"
                        min="0"
                        value={item.quantity}
                        onChange={(e) =>
                          updateQuantity(item.id, e.target.value)
                        }
                        className="w-16 p-1 border rounded mt-2"
                      />
                    </div>
                    <button
                      onClick={() => removeFromCart(item.id)}
                      className="text-red-500 hover:text-red-700"
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
                <div className="border-t pt-4">
                  <p className="text-lg font-bold">Total: ${getTotalPrice()}</p>
                  <button
                    className="w-full bg-green-600 text-white p-2 rounded mt-4 hover:bg-green-700"
                    onClick={() =>
                      alert("Funcionalidad de pago aún no implementada")
                    }
                  >
                    Pagar
                  </button>
                </div>
              </>
            ) : (
              <p>Tu carrito está vacío.</p>
            )}
            <button
              onClick={() => setIsCartOpen(false)}
              className="absolute top-4 right-4 text-gray-600 hover:text-gray-800"
            >
              ✕
            </button>
          </div>
        )}

        {/* Lista de productos */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {products.length > 0 ? (
            products.map((product) => (
              <div
                key={product.id}
                className="bg-white rounded-lg shadow-lg overflow-hidden transform transition duration-300 hover:scale-105"
              >
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-full h-48 object-cover"
                  />
                ) : (
                  <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
                    <span className="text-gray-500">Sin imagen</span>
                  </div>
                )}
                <div className="p-4">
                  <h2 className="text-xl font-semibold mb-2">{product.name}</h2>
                  <p className="text-gray-600 mb-2 line-clamp-2">
                    {product.description}
                  </p>
                  <p
                    className="text-lg font-bold mb-4"
                    style={{ color: settings?.primary_color || "#2563eb" }}
                  >
                    ${product.price}
                  </p>
                  <button
                    onClick={() => addToCart(product)}
                    className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
                  >
                    Agregar al Carrito
                  </button>
                </div>
              </div>
            ))
          ) : (
            <p className="col-span-full text-center">
              No hay productos disponibles.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
