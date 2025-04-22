"use client";

import { createContext, useContext, useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "./supabase";
import { useNotification } from "./NotificationContext";

const ShopContext = createContext();

export function ShopProvider({ children }) {
  const [shopData, setShopData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [csrfToken, setCsrfToken] = useState(null);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 3;
  const router = useRouter();
  const { addNotification } = useNotification();

  const getCsrfTokenFromCookies = () => {
    if (typeof document === "undefined") return null;
    const cookies = document.cookie.split("; ");
    const csrfCookie = cookies.find((cookie) =>
      cookie.startsWith("csrf_token=")
    );
    return csrfCookie ? csrfCookie.split("=")[1] : null;
  };

  const fetchShopData = async (shopName) => {
    if (!shopName) return;

    try {
      // Verificar autenticación
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session) {
        router.push("/login");
        return;
      }

      // Obtener el token CSRF
      let token = getCsrfTokenFromCookies();
      if (!token) {
        const csrfResponse = await fetch("/api/csrf-token");
        if (!csrfResponse.ok) {
          const result = await csrfResponse.json();
          throw new Error(result.error || "Error al obtener el token CSRF");
        }
        const csrfResult = await csrfResponse.json();
        token = csrfResult.csrfToken;
      }
      setCsrfToken(token);

      // Si ya tenemos los datos para esta tienda, no hacemos una nueva solicitud
      if (shopData && shopData.shop.shop_name === shopName) {
        setLoading(false);
        return;
      }

      // Obtener datos de la tienda
      const shopResponse = await fetch(`/api/shop-data?shopName=${shopName}`);
      if (!shopResponse.ok) {
        const result = await shopResponse.json();
        throw new Error(
          result.error || "Error al cargar los datos de la tienda"
        );
      }
      const shopResult = await shopResponse.json();

      setShopData(shopResult);
      setRetryCount(0);
    } catch (err) {
      if (err.message.includes("No autorizado") && retryCount < maxRetries) {
        setRetryCount((prev) => prev + 1);
        setTimeout(() => fetchShopData(shopName), 1000);
        return;
      }
      addNotification(err.message, "error");
      if (err.message.includes("No autorizado")) {
        router.push("/login");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <ShopContext.Provider
      value={{
        shopData,
        setShopData,
        fetchShopData,
        loading,
        csrfToken,
      }}
    >
      {children}
    </ShopContext.Provider>
  );
}

export function useShop() {
  return useContext(ShopContext);
}
