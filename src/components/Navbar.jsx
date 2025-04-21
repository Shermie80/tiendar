// components/Narbar.jsx

"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Navbar() {
  const [user, setUser] = useState(null);
  const [shopName, setShopName] = useState(null);
  const router = useRouter();

  useEffect(() => {
    // Obtener la sesión del usuario
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setUser(session.user);
        // Buscar el nombre de la tienda
        const { data: shop } = await supabase
          .from("shops")
          .select("shop_name")
          .eq("user_id", session.user.id)
          .single();
        if (shop) {
          setShopName(shop.shop_name);
        }
      }
    };
    getSession();

    // Escuchar cambios en la autenticación
    const { data: authListener } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (event === "SIGNED_OUT") {
          setShopName(null);
          router.push("/login");
        }
      }
    );

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <nav className="bg-blue-600 p-4 text-white">
      <div className="container mx-auto flex justify-between items-center">
        <Link href="/" className="text-xl font-bold">
          Tiendar
        </Link>
        <div className="space-x-4">
          {user ? (
            <>
              {shopName && (
                <>
                  <Link href={`/${shopName}`} className="hover:underline">
                    Mi Tienda
                  </Link>
                  <Link href={`/${shopName}/admin`} className="hover:underline">
                    Admin
                  </Link>
                </>
              )}
              <button
                onClick={handleLogout}
                className="bg-red-500 px-3 py-1 rounded hover:bg-red-600"
              >
                Cerrar Sesión
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="hover:underline">
                Iniciar Sesión
              </Link>
              <Link href="/register" className="hover:underline">
                Registrarse
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
