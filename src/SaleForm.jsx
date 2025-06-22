// src/SaleForm.jsx

import React, { useState, useMemo } from 'react';

const UMBRAL_POR_MAYOR = 200000;
const DESCUENTO_PORCENTAJE = 0.10;

function SaleForm({ inventory, onRegisterSale }) {
  const [saleDate, setSaleDate] = useState(new Date().toISOString().split('T')[0]);
  const [itemCategory, setItemCategory] = useState('');
  const [itemProductId, setItemProductId] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [cart, setCart] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('Efectivo');
  
  const productCategories = Object.keys(inventory).sort();

  const handleAddItemToCart = () => {
    if (!itemProductId || itemQuantity <= 0) {
      alert('Selecciona un producto y cantidad válida.');
      return;
    }
    const product = inventory[itemCategory]?.find(p => p.id === itemProductId);
    if (!product) return;

    if (product.stock < itemQuantity) {
      alert(`Stock insuficiente. Disponible: ${product.stock}`);
      return;
    }

    const newItem = {
      id: product.id, // ID de Firestore del producto
      name: product.name,
      quantity: itemQuantity,
      price: product.price,
      subtotal: product.price * itemQuantity,
      originalStock: product.stock, // Guardamos el stock original para el cálculo
    };

    setCart(prevCart => [...prevCart, newItem]);
    setItemProductId('');
    setItemQuantity(1);
  };
  
  const handleRemoveFromCart = (productId) => {
    setCart(prevCart => prevCart.filter(item => item.id !== productId));
  };

  const handleSubmitSale = () => {
    if (cart.length === 0) {
        alert("El carrito está vacío.");
        return;
    }
    const saleData = {
        date: saleDate,
        items: cart,
        subtotal: cartSubtotal,
        descuento: discount,
        totalFinal: finalTotal,
        metodoPago: paymentMethod,
        description: `Venta (${isWholesale ? 'Por Mayor' : 'Detal'}) de ${cart.length} tipo(s) de producto.`
    };
    onRegisterSale(saleData);
    setCart([]);
    setPaymentMethod('Efectivo');
    setSaleDate(new Date().toISOString().split('T')[0]);
  };

  const { cartSubtotal, discount, finalTotal, isWholesale } = useMemo(() => {
    const subtotal = cart.reduce((sum, item) => sum + item.subtotal, 0);
    const wholesale = subtotal >= UMBRAL_POR_MAYOR;
    const finalDiscount = wholesale ? subtotal * DESCUENTO_PORCENTAJE : 0;
    const total = subtotal - finalDiscount;
    return { cartSubtotal: subtotal, isWholesale: wholesale, discount: finalDiscount, finalTotal: total };
  }, [cart]);

  return (
    <div className="space-y-4">
      <div className="p-4 border rounded-lg bg-white shadow-sm space-y-4">
        <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Fecha de la Venta</label>
            <input type="date" value={saleDate} onChange={e => setSaleDate(e.target.value)} className="w-full p-2 border-2 border-gray-200 rounded-md" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <select value={itemCategory} onChange={(e) => { setItemCategory(e.target.value); setItemProductId(''); }} className="w-full p-2 border-2 border-gray-200 rounded-md">
                <option value="">Categoría...</option>
                {productCategories.map(cat => <option key={cat} value={cat}>{cat.charAt(0).toUpperCase() + cat.slice(1)}</option>)}
            </select>
            <select value={itemProductId} onChange={(e) => setItemProductId(e.target.value)} className="w-full p-2 border-2 border-gray-200 rounded-md" disabled={!itemCategory}>
                <option value="">Producto...</option>
                {itemCategory && inventory[itemCategory]?.map(p => <option key={p.id} value={p.id}>{p.name} (Stock: {p.stock})</option>)}
            </select>
            <input type="number" value={itemQuantity} onChange={e => setItemQuantity(parseInt(e.target.value))} min="1" className="w-full p-2 border-2 border-gray-200 rounded-md" />
        </div>
        <button onClick={handleAddItemToCart} className="w-full text-white p-2 rounded-lg font-semibold" style={{background: 'linear-gradient(135deg, #444b1d 0%, #5a6123 100%)'}}>
            + Agregar Producto a la Venta
        </button>
      </div>
      
      <div className="p-4 border-t">
        <h3 className="font-bold text-lg mb-2">Resumen de Venta Actual:</h3>
        <div className="space-y-2 mb-4">
            {cart.length === 0 ? <p className="text-gray-500">El carrito está vacío...</p> : (
                cart.map(item => (
                    <div key={item.id} className="flex justify-between items-center bg-white p-2 rounded-md shadow-sm">
                        <span>{item.quantity} x {item.name}</span>
                        <span className="font-semibold">${item.subtotal.toLocaleString('es-CO')}</span>
                        <button onClick={() => handleRemoveFromCart(item.id)} className="text-red-500 font-bold px-2">X</button>
                    </div>
                ))
            )}
        </div>
        
        <div className="space-y-3 pt-4 border-t">
          <div className="flex justify-between font-semibold"><span>Subtotal:</span><span>${cartSubtotal.toLocaleString('es-CO')}</span></div>
          {isWholesale && (<div className="flex justify-between font-bold text-green-600"><span>Descuento por Mayor (10%):</span><span>-${discount.toLocaleString('es-CO')}</span></div>)}
          <div className="flex justify-between font-bold text-xl border-t pt-2 mt-2"><span>TOTAL FINAL:</span><span>${finalTotal.toLocaleString('es-CO')}</span></div>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className="w-full p-3 border-2 border-gray-200 rounded-lg mt-4">
              <option>Efectivo</option><option>Tarjeta Débito/Crédito</option><option>PSE</option><option>Nequi</option><option>Daviplata</option><option>Otro</option>
          </select>
          <button onClick={handleSubmitSale} className="w-full text-white p-3 rounded-lg font-bold text-lg transition-transform hover:scale-105" style={{background: '#28a745'}} disabled={cart.length === 0}>
              ✅ Registrar Venta Completa
          </button>
        </div>
      </div>
    </div>
  );
}

export default SaleForm;