// src/AddProductModal.jsx

import React, { useState } from 'react';

const AddProductModal = ({ onClose, onAddProduct }) => {
  const [category, setCategory] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!category || !name || !price || !stock) {
      alert('Todos los campos son obligatorios.');
      return;
    }
    onAddProduct({
      category,
      name,
      price: parseFloat(price),
      stock: parseInt(stock, 10),
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
      <div className="bg-white p-8 rounded-2xl max-w-lg w-full mx-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-2xl font-bold text-gray-800 mb-6">➕ Agregar Nuevo Producto al Inventario</h3>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Categoría</label>
            <select value={category} onChange={(e) => setCategory(e.target.value)} className="w-full p-3 border-2 border-gray-200 rounded-lg" required>
              <option value="">Seleccionar...</option>
              <option value="capilar">Capilar</option>
              <option value="barba">Barba</option>
              <option value="facial">Facial</option>
              <option value="maquinas">Máquinas</option>
              <option value="insumos">Insumos</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Nombre del Producto</label>
            <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="Ej: Cera Inmortal" className="w-full p-3 border-2 border-gray-200 rounded-lg" required />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Precio de Venta</label>
              <input type="number" value={price} onChange={(e) => setPrice(e.target.value)} placeholder="42000" className="w-full p-3 border-2 border-gray-200 rounded-lg" required />
            </div>
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-1">Stock Inicial</label>
              <input type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="12" className="w-full p-3 border-2 border-gray-200 rounded-lg" required />
            </div>
          </div>
          <div className="flex gap-4 pt-4">
            <button type="submit" className="w-full text-white p-3 rounded-lg font-semibold" style={{ background: 'linear-gradient(135deg, #444b1d 0%, #5a6123 100%)' }}>💾 Guardar Producto</button>
            <button type="button" onClick={onClose} className="w-full bg-red-500 text-white p-3 rounded-lg font-semibold">❌ Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddProductModal;