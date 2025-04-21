// app/register/page.jsx

"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabase";
import { useRouter } from "next/navigation";
import Navbar from "../../components/Navbar";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [shopName, setShopName] = useState("");
  const [error, setError] = useState(null);
  const [shopNameError, setShopNameError] = useState(null);
  const [isShopNameAvailable, setIsShopNameAvailable] = useState(null);
  const router = useRouter();

  // Validar disponibilidad del nombre de la tienda en tiempo real
  useEffect(() => {
    const validateShopName = async () => {
      setShopNameError(null);
      setIsShopNameAvailable(null);

      if (shopName.length < 3 || shopName.length > 20) {
        setShopNameError(
          "El nombre de la tienda debe tener entre 3 y 20 caracteres."
        );
        return;
      }

      const validShopNameRegex = /^[a-z0-9-]+$/;
      if (!validShopNameRegex.test(shopName)) {
        setShopNameError(
          "El nombre de la tienda solo puede contener letras, números y guiones (-)."
        );
        return;
      }

      const { data: existingShop, error: shopError } = await supabase
        .from("shops")
        .select("shop_name")
        .eq("shop_name", shopName.toLowerCase())
        .single();

      if (shopError && shopError.code !== "PGRST116") {
        setShopNameError(
          "Error al verificar el nombre de la tienda. Intenta de nuevo."
        );
        return;
      }

      if (existingShop) {
        setIsShopNameAvailable(false);
        setShopNameError("Este nombre de tienda ya está en uso.");
      } else {
        setIsShopNameAvailable(true);
      }
    };

    if (shopName) {
      const debounce = setTimeout(() => {
        validateShopName();
      }, 500);

      return () => clearTimeout(debounce);
    }
  }, [shopName]);

  const handleRegister = async (e) => {
    e.preventDefault();
    setError(null);

    if (shopName.length < 3 || shopName.length > 20) {
      setError("El nombre de la tienda debe tener entre 3 y 20 caracteres.");
      return;
    }

    const validShopNameRegex = /^[a-z0-9-]+$/;
    if (!validShopNameRegex.test(shopName)) {
      setError(
        "El nombre de la tienda solo puede contener letras, números y guiones (-)."
      );
      return;
    }

    if (!isShopNameAvailable) {
      setError("El nombre de la tienda no está disponible.");
      return;
    }

    try {
      const response = await fetch("/api/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email, password, shopName }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Error al crear la cuenta");
      }

      const result = await response.json();
      router.push(`/${result.shopName}`);
    } catch (err) {
      console.error("[Register] Error:", err);
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="flex items-center justify-center py-12">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
          <h1 className="text-2xl font-bold mb-6 text-center">
            Crear tu cuenta
          </h1>
          <form onSubmit={handleRegister}>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 p-2 w-full border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Contraseña
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 p-2 w-full border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Nombre de tu tienda
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => setShopName(e.target.value.toLowerCase())}
                className={`mt-1 p-2 w-full border rounded ${
                  isShopNameAvailable === false
                    ? "border-red-500"
                    : isShopNameAvailable === true
                    ? "border-green-500"
                    : ""
                }`}
                required
              />
              {shopNameError && (
                <p className="text-red-500 text-sm mt-1">{shopNameError}</p>
              )}
              {isShopNameAvailable === true && (
                <p className="text-green-500 text-sm mt-1">
                  ¡Nombre disponible!
                </p>
              )}
            </div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
              disabled={isShopNameAvailable !== true}
            >
              Crear cuenta
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
