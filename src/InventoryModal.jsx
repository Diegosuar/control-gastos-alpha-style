// src/InventoryModal.jsx

import React from 'react';

const InventoryModal = ({ inventory, onClose, onEditStock }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50" onClick={onClose}>
      <div className="bg-white p-8 rounded-2xl max-w-6xl w-full max-h-[90vh] overflow-y-auto shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-2xl font-bold text-gray-800 mb-6">📦 Inventario de Productos</h3>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr style={{ background: 'linear-gradient(135deg, #444b1d 0%, #3a4019 100%)' }} className="text-white">
                <th className="p-3 text-left">Producto</th>
                <th className="p-3 text-left">Categoría</th>
                <th className="p-3 text-left">Precio</th>
                <th className="p-3 text-left">Stock</th>
                <th className="p-3 text-left">Estado</th>
                <th className="p-3 text-left">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {Object.keys(inventory).sort().flatMap(category =>
                inventory[category].map(product => {
                  const stockStatus = product.stock <= 5 ? '🔴 Crítico' : product.stock <= 10 ? '🟡 Bajo' : '🟢 Normal';
                  const stockClass = product.stock <= 5 ? 'text-red-600' : product.stock <= 10 ? 'text-yellow-600' : 'text-green-600';

                  return (
                    <tr key={product.id} className="border-b hover:bg-gray-50">
                      <td className="p-3 font-bold">{product.name}</td>
                      <td className="p-3">{product.category.charAt(0).toUpperCase() + product.category.slice(1)}</td>
                      <td className="p-3">${product.price.toLocaleString('es-CO')}</td>
                      <td className={`p-3 font-bold ${stockClass}`}>{product.stock}</td>
                      <td className="p-3">{stockStatus}</td>
                      <td className="p-3">
                        <button onClick={() => onEditStock(product.id, product.name, product.stock)} className="bg-gray-600 text-white px-3 py-1 rounded text-xs hover:bg-gray-700">📝 Stock</button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
        <div className="flex justify-end gap-4 mt-6">
          <button onClick={onClose} className="bg-red-500 text-white px-6 py-2 rounded-lg font-semibold">❌ Cerrar</button>
        </div>
      </div>
    </div>
  );
};

export default InventoryModal;