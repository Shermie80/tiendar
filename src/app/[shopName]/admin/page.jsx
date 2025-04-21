// app/[shopName]/admin/page.jsx

"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabase";
import Navbar from "../../../components/Navbar";

export default function AdminPage({ params }) {
  const [shop, setShop] = useState(null);
  const [settings, setSettings] = useState(null);
  const [products, setProducts] = useState([]);
  const [editingProduct, setEditingProduct] = useState(null);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
    image_url: "",
  });

  // Obtener datos iniciales
  useEffect(() => {
    const fetchData = async () => {
      const { shopName } = await params;

      const { data: shopData, error: shopError } = await supabase
        .from("shops")
        .select("*")
        .eq("shop_name", shopName)
        .single();

      if (shopError || !shopData) {
        setError("Tienda no encontrada");
        return;
      }

      setShop(shopData);

      const { data: settingsData, error: settingsError } = await supabase
        .from("shop_settings")
        .select("*")
        .eq("shop_id", shopData.id)
        .single();

      if (settingsError && settingsError.code !== "PGRST116") {
        console.error("Error fetching shop settings:", settingsError);
      }

      setSettings(
        settingsData || { primary_color: "#2563eb", secondary_color: "#1f2937" }
      );

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

  const handleEditProduct = (product) => {
    setEditingProduct({ ...product });
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();
    const { id, name, description, price, image_url } = editingProduct;

    const { error: updateError } = await supabase
      .from("products")
      .update({ name, description, price, image_url })
      .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setProducts(
      products.map((p) =>
        p.id === id ? { ...p, name, description, price, image_url } : p
      )
    );
    setEditingProduct(null);
  };

  const handleDeleteProduct = async (productId) => {
    const { error: deleteError } = await supabase
      .from("products")
      .delete()
      .eq("id", productId);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setProducts(products.filter((p) => p.id !== productId));
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        body: new FormData(e.target),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Error al agregar el producto");
      }

      // Actualizar la lista de productos
      const { data: newProductData } = await supabase
        .from("products")
        .select("*")
        .eq("shop_id", shop.id)
        .order("created_at", { ascending: false })
        .limit(1);

      if (newProductData && newProductData.length > 0) {
        setProducts([newProductData[0], ...products]);
      }

      setSuccess("Producto agregado correctamente");
      setNewProduct({ name: "", description: "", price: "", image_url: "" });
    } catch (err) {
      setError(err.message);
    }
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <h1 className="text-2xl font-bold">{error}</h1>
      </div>
    );
  }

  if (!shop) {
    return <div>Cargando...</div>;
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <Navbar />
      <div className="container mx-auto py-12">
        <h1 className="text-3xl font-bold mb-6">
          Administrar {shop.shop_name}
        </h1>

        {/* Estadísticas básicas */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Estadísticas</h2>
          <div className="bg-white p-6 rounded shadow-md">
            <p className="text-lg">Número de productos: {products.length}</p>
          </div>
        </div>

        {/* Listado de productos */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Tus Productos</h2>
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white p-4 rounded shadow-md"
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
                  <div className="mt-4 space-x-2">
                    <button
                      onClick={() => handleEditProduct(product)}
                      className="bg-yellow-500 text-white px-3 py-1 rounded hover:bg-yellow-600"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(product.id)}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600"
                    >
                      Eliminar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p>No hay productos disponibles.</p>
          )}
        </div>

        {/* Formulario para editar producto */}
        {editingProduct && (
          <div className="mb-12">
            <h2 className="text-2xl font-semibold mb-4">Editar Producto</h2>
            <form
              onSubmit={handleUpdateProduct}
              className="bg-white p-6 rounded shadow-md max-w-lg"
            >
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Nombre del producto
                </label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      name: e.target.value,
                    })
                  }
                  className="mt-1 p-2 w-full border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Descripción
                </label>
                <textarea
                  value={editingProduct.description || ""}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      description: e.target.value,
                    })
                  }
                  className="mt-1 p-2 w-full border rounded"
                ></textarea>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  Precio
                </label>
                <input
                  type="number"
                  value={editingProduct.price}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      price: parseFloat(e.target.value),
                    })
                  }
                  step="0.01"
                  className="mt-1 p-2 w-full border rounded"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700">
                  URL de la imagen (opcional)
                </label>
                <input
                  type="text"
                  value={editingProduct.image_url || ""}
                  onChange={(e) =>
                    setEditingProduct({
                      ...editingProduct,
                      image_url: e.target.value,
                    })
                  }
                  className="mt-1 p-2 w-full border rounded"
                />
              </div>
              <div className="space-x-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
                >
                  Guardar Cambios
                </button>
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="bg-gray-500 text-white p-2 rounded hover:bg-gray-600"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Formulario para agregar productos */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Agregar Producto</h2>
          <form
            onSubmit={handleAddProduct}
            className="bg-white p-6 rounded shadow-md max-w-lg"
          >
            <input type="hidden" name="shop_id" value={shop.id} />
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Nombre del producto
              </label>
              <input
                type="text"
                name="name"
                value={newProduct.name}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
                className="mt-1 p-2 w-full border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Descripción
              </label>
              <textarea
                name="description"
                value={newProduct.description}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, description: e.target.value })
                }
                className="mt-1 p-2 w-full border rounded"
              ></textarea>
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                Precio
              </label>
              <input
                type="number"
                name="price"
                value={newProduct.price}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, price: e.target.value })
                }
                step="0.01"
                className="mt-1 p-2 w-full border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700">
                URL de la imagen (opcional)
              </label>
              <input
                type="text"
                name="image_url"
                value={newProduct.image_url}
                onChange={(e) =>
                  setNewProduct({ ...newProduct, image_url: e.target.value })
                }
                className="mt-1 p-2 w-full border rounded"
              />
            </div>
            {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
            {success && (
              <p className="text-green-500 text-sm mb-4">{success}</p>
            )}
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
            >
              Agregar producto
            </button>
          </form>
        </div>

        {/* Formulario para personalizar la tienda */}
        <div>
          <h2 className="text-2xl font-semibold mb-4">Personalizar Tienda</h2>
          <form
            action="/api/shop-settings"
            method="POST"
            className="bg-white p-6 rounded shadow-md max-w-lg"
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
