"use client";

import { useState, useEffect } from "react";
import Sidebar from "@/components/Sidebar";
import { useNotification } from "@/lib/NotificationContext";
import { useShop } from "@/lib/ShopContext";

export default function ProductsPage({ params }) {
  const [editingProduct, setEditingProduct] = useState(null);
  const [newProduct, setNewProduct] = useState({
    name: "",
    description: "",
    price: "",
  });
  const { shopData, fetchShopData, loading, csrfToken } = useShop();
  const { addNotification } = useNotification();
  const { shopName } = params;

  useEffect(() => {
    fetchShopData(shopName);
  }, [shopName, fetchShopData]);

  const handleEditProduct = (product) => {
    setEditingProduct({ ...product });
  };

  const handleUpdateProduct = async (e) => {
    e.preventDefault();

    const { id, name, description, price, image_url } = editingProduct;

    if (price <= 0) {
      addNotification("El precio debe ser mayor a 0", "error");
      return;
    }

    try {
      const response = await fetch("/api/products/update", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({
          product_id: id,
          name,
          description,
          price,
          image_url,
        }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Error al actualizar el producto");
      }

      const result = await response.json();

      shopData.products = shopData.products.map((p) =>
        p.id === id ? { ...p, name, description, price, image_url } : p
      );
      setEditingProduct(null);
      addNotification("Producto actualizado correctamente", "success");
    } catch (err) {
      addNotification(err.message, "error");
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      const response = await fetch("/api/products/delete", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-csrf-token": csrfToken,
        },
        body: JSON.stringify({ product_id: productId }),
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Error al eliminar el producto");
      }

      shopData.products = shopData.products.filter((p) => p.id !== productId);
      addNotification("Producto eliminado correctamente", "success");
    } catch (err) {
      addNotification(err.message, "error");
    }
  };

  const handleAddProduct = async (e) => {
    e.preventDefault();

    const formData = new FormData(e.target);
    const price = parseFloat(formData.get("price"));

    if (price <= 0) {
      addNotification("El precio debe ser mayor a 0", "error");
      return;
    }

    try {
      const response = await fetch("/api/products", {
        method: "POST",
        headers: {
          "x-csrf-token": csrfToken,
        },
        body: formData,
      });

      if (!response.ok) {
        const result = await response.json();
        throw new Error(result.error || "Error al agregar el producto");
      }

      const result = await response.json();

      shopData.products = [result.newProduct, ...shopData.products];
      addNotification("Producto agregado correctamente", "success");
      setNewProduct({ name: "", description: "", price: "" });
      e.target.reset();
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

  const { shop, products } = shopData;

  return (
    <div className="flex min-h-screen bg-gray-100">
      {/* Sidebar */}
      <Sidebar shopName={shopName} />

      {/* Contenido principal */}
      <div className="flex-1 ml-0 md:ml-64 p-6">
        <h1 className="text-3xl font-bold mb-6">
          Administrar {shop.shop_name}
        </h1>

        {/* Listado de productos */}
        <div className="mb-12">
          <h2 className="text-2xl font-semibold mb-4">Tus Productos</h2>
          <div className="bg-white p-4 rounded-lg shadow-md mb-6">
            <p className="text-lg text-gray-700">
              Tienes <span className="font-bold">{products.length}</span>{" "}
              producto{products.length !== 1 ? "s" : ""} en tu tienda.
            </p>
          </div>
          {products.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-white p-4 rounded-lg shadow-md"
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
              className="bg-white p-6 rounded-lg shadow-md max-w-lg"
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
                />
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
                  Imagen actual (no editable)
                </label>
                {editingProduct.image_url ? (
                  <img
                    src={editingProduct.image_url}
                    alt="Imagen actual"
                    className="w-32 h-32 object-cover rounded"
                  />
                ) : (
                  <p>No hay imagen</p>
                )}
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
            className="bg-white p-6 rounded-lg shadow-md max-w-lg"
            encType="multipart/form-data"
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
              />
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
                Imagen (opcional)
              </label>
              <input
                type="text"
                name="image_url"
                className="mt-1 p-2 w-full border rounded"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-600 text-white p-2 rounded hover:bg-blue-700"
            >
              Agregar producto
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
