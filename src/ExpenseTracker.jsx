// src/ExpenseTracker.jsx
// VERSIÓN FINAL COMPLETA (Sin omisiones)

import React, { useState, useEffect, useMemo } from 'react';
import { db } from './firebase';
import { collection, onSnapshot, addDoc, deleteDoc, doc, updateDoc, writeBatch } from 'firebase/firestore';

import SaleForm from './SaleForm';
import AddProductModal from './AddProductModal';
import InventoryModal from './InventoryModal';

const SummaryCards = ({ totalIncome, totalExpense, balance }) => (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-8" style={{ background: 'linear-gradient(135deg, #f4f5f0 0%, #e8eadf 100%)' }}>
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 hover:transform hover:-translate-y-1 transition-all duration-300" style={{ borderLeftColor: '#444b1d' }}>
          <h3 className="text-gray-700 font-semibold mb-2">💚 Total Ingresos</h3>
          <div className="text-3xl font-bold mb-1" style={{ color: '#444b1d' }}>${totalIncome.toLocaleString('es-CO')}</div>
          <small>Este mes</small>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 border-red-500 hover:transform hover:-translate-y-1 transition-all duration-300">
          <h3 className="text-gray-700 font-semibold mb-2">💸 Total Gastos</h3>
          <div className="text-3xl font-bold text-red-600 mb-1">${totalExpense.toLocaleString('es-CO')}</div>
          <small>Este mes</small>
        </div>
        <div className="bg-white p-6 rounded-xl shadow-lg border-l-4 hover:transform hover:-translate-y-1 transition-all duration-300" style={{ borderLeftColor: '#6b7529' }}>
          <h3 className="text-gray-700 font-semibold mb-2">💰 Balance</h3>
          <div className={`text-3xl font-bold mb-1`} style={{ color: balance >= 0 ? '#444b1d' : '#dc3545' }}>${balance.toLocaleString('es-CO')}</div>
          <small>Ingresos - Gastos</small>
        </div>
    </div>
);

const ExpenseTracker = () => {
    const categories = {
        expense: ['Arriendo', 'Servicios', 'Nómina', 'Proveedores', 'Marketing', 'Impuestos', 'Otros Gastos'],
        income: ['Servicios Barbería', 'Otros Ingresos']
    };
    
    const [transactions, setTransactions] = useState([]);
    const [productInventory, setProductInventory] = useState({});
    const [formData, setFormData] = useState({ date: new Date().toISOString().split('T')[0], type: 'expense', category: '', description: '', amount: '' });
    const [filters, setFilters] = useState({ month: String(new Date().getMonth() + 1), year: String(new Date().getFullYear()), type: '' });
    const [currentPeriod, setCurrentPeriod] = useState({ month: new Date().getMonth() + 1, year: new Date().getFullYear() });
    const [successMessage, setSuccessMessage] = useState('');
    const [showInventoryModal, setShowInventoryModal] = useState(false);
    const [showAddProductModal, setShowAddProductModal] = useState(false);

    useEffect(() => {
        const unsubscribeTransactions = onSnapshot(collection(db, "transactions"), (snapshot) => {
            const transactionsData = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));
            setTransactions(transactionsData);
        });

        const unsubscribeInventory = onSnapshot(collection(db, "inventory"), (snapshot) => {
            const inventoryData = {};
            snapshot.docs.forEach(doc => {
                const product = { ...doc.data(), id: doc.id };
                if (!inventoryData[product.category]) {
                    inventoryData[product.category] = [];
                }
                inventoryData[product.category].push(product);
            });
            setProductInventory(inventoryData);
        });

        return () => {
            unsubscribeTransactions();
            unsubscribeInventory();
        };
    }, []);

    const showSuccess = (message) => {
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(''), 3000);
    };

    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value, ...(name === 'type' && { category: '' }) }));
    };
    
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };
    
    const handleDeleteTransaction = async (id) => {
        if (window.confirm("¿Estás seguro de que quieres eliminar este movimiento?")) {
            const transactionToDelete = transactions.find(t => t.id === id);
            
            if (transactionToDelete && transactionToDelete.category === 'Ventas' && Array.isArray(transactionToDelete.items)) {
                try {
                    const batch = writeBatch(db);
                    transactionToDelete.items.forEach(item => {
                        const productRef = doc(db, "inventory", item.id);
                        const newStock = item.originalStock; 
                        batch.update(productRef, { stock: newStock });
                    });
                    await batch.commit();
                } catch (error) {
                    console.error("Error al devolver el stock: ", error);
                    alert("Hubo un error al devolver el stock.");
                    return;
                }
            }
            await deleteDoc(doc(db, "transactions", id));
            showSuccess("Movimiento eliminado correctamente.");
        }
    };

    const handleAddExpenseIncome = async (e) => {
        e.preventDefault();
        const { date, type, category, description, amount } = formData;
        if (!date || !type || !category || !description || !amount) {
            alert('⚠️ Por favor, completa todos los campos'); return;
        }
        await addDoc(collection(db, "transactions"), { date, type, category, description, amount: parseFloat(amount) });
        setFormData({ date: new Date().toISOString().split('T')[0], type: 'expense', category: '', description: '', amount: '' });
        showSuccess('✅ Movimiento agregado');
    };

    const handleRegisterSale = async (saleData) => {
        const { date, items, subtotal, descuento, totalFinal, metodoPago, description } = saleData;
        try {
            const transactionData = { date, type: 'income', category: 'Ventas', items, subtotal, descuento, amount: totalFinal, metodoPago, description };
            await addDoc(collection(db, "transactions"), transactionData);

            const batch = writeBatch(db);
            items.forEach(item => {
                const productRef = doc(db, "inventory", item.id);
                const newStock = item.originalStock - item.quantity;
                batch.update(productRef, { stock: newStock });
            });
            await batch.commit();
            showSuccess('✅ Venta registrada exitosamente');
        } catch (error) {
            console.error("Error registrando la venta: ", error);
            alert("Hubo un error al registrar la venta.");
        }
    };
    
    const handleAddNewProduct = async (productData) => {
        try {
            await addDoc(collection(db, "inventory"), productData);
            showSuccess(`Producto "${productData.name}" agregado exitosamente.`);
        } catch (error) {
            console.error("Error agregando producto: ", error);
            alert("Hubo un error al agregar el producto.");
        }
    };
    
    const handleEditStock = async (productId, productName, currentStock) => {
        const newStock = prompt(`Actualizar stock para ${productName}:\nStock actual: ${currentStock}`, currentStock);
        if (newStock !== null && !isNaN(newStock) && parseInt(newStock) >= 0) {
            const productRef = doc(db, "inventory", productId);
            await updateDoc(productRef, { stock: parseInt(newStock) });
            showSuccess(`Stock de ${productName} actualizado.`);
        }
    };

    const parseDate = (dateString) => {
        if (!dateString) return null;
        const parts = dateString.split('-');
        return new Date(parts[0], parts[1] - 1, parts[2]);
    };

    const filteredTransactions = useMemo(() => {
        if (!transactions) return [];
        return transactions.filter(t => {
            const transactionDate = parseDate(t.date);
            if (!transactionDate) return false;

            const monthMatch = !filters.month || transactionDate.getMonth() + 1 === parseInt(filters.month);
            const yearMatch = !filters.year || transactionDate.getFullYear() === parseInt(filters.year);
            const typeMatch = !filters.type || t.type === filters.type;
            return monthMatch && yearMatch && typeMatch;
        }).sort((a, b) => parseDate(b.date) - parseDate(a.date));
    }, [transactions, filters]);

    const summary = useMemo(() => {
        const monthTransactions = transactions.filter(t => {
            const transactionDate = parseDate(t.date);
            if (!transactionDate) return false;
            return transactionDate.getMonth() + 1 === currentPeriod.month && transactionDate.getFullYear() === currentPeriod.year;
        });
        const totalIncome = monthTransactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
        const totalExpense = monthTransactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
        const balance = totalIncome - totalExpense;
        return { totalIncome, totalExpense, balance };
    }, [transactions, currentPeriod]);

    const yearsForFilter = Array.from(new Set(transactions.map(t => t.date ? parseDate(t.date).getFullYear() : null).filter(Boolean))).sort((a,b) => b-a);

    return (
        <div className="min-h-screen p-5 bg-black">
            {successMessage && <div className="fixed top-5 right-5 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg z-50">{successMessage}</div>}
            
            {showAddProductModal && <AddProductModal onClose={() => setShowAddProductModal(false)} onAddProduct={handleAddNewProduct} />}
            {showInventoryModal && <InventoryModal inventory={productInventory} onClose={() => setShowInventoryModal(false)} onEditStock={handleEditStock} />}
            
            <div className="max-w-7xl mx-auto bg-white rounded-2xl shadow-2xl overflow-hidden">
                <div className="text-white p-8 text-center" style={{ background: 'linear-gradient(135deg, #444b1d 0%, #5a6123 50%, #3a4019 100%)' }}>
                    <h1 className="text-4xl font-bold mb-2 drop-shadow-lg"> Control de Gastos y Ventas - Alpha Style 🧔🏻</h1>
                </div>
                
                <SummaryCards totalIncome={summary.totalIncome} totalExpense={summary.totalExpense} balance={summary.balance} />

                <div className="p-8 bg-white border-y border-gray-200">
                    <div className="mb-8 flex flex-wrap gap-4">
                        <button onClick={() => setShowAddProductModal(true)} className="px-6 py-3 font-semibold text-white rounded-lg shadow-md transition-transform hover:scale-105" style={{background: 'linear-gradient(135deg, #6c757d 0%, #5a6268 100%)'}}>➕ Agregar Nuevo Producto</button>
                        <button onClick={() => setShowInventoryModal(true)} className="px-6 py-3 font-semibold text-white rounded-lg shadow-md transition-transform hover:scale-105" style={{background: 'linear-gradient(135deg, #444b1d 0%, #5a6123 100%)'}}>📦 Ver Inventario</button>
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
                         <div className="lg:col-span-3 p-6 bg-gray-50 rounded-xl border">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">🛒 Registrar Venta de Productos</h2>
                            <SaleForm inventory={productInventory} onRegisterSale={handleRegisterSale} />
                        </div>
                        <div className="lg:col-span-2 p-6 bg-gray-50 rounded-xl border">
                            <h2 className="text-2xl font-bold text-gray-800 mb-6">💸 Registrar Gasto / Otro Ingreso</h2>
                            <form onSubmit={handleAddExpenseIncome} className="space-y-4">
                                <div><label className="block text-sm font-semibold text-gray-700 mb-1">Fecha</label><input type="date" name="date" value={formData.date} onChange={handleFormChange} className="w-full p-2 border-2 border-gray-200 rounded-md" required/></div>
                                <select name="type" value={formData.type} onChange={handleFormChange} className="w-full p-3 border-2 border-gray-200 rounded-lg" required><option value="expense">Gasto</option><option value="income">Otro Ingreso</option></select>
                                <select name="category" value={formData.category} onChange={handleFormChange} className="w-full p-3 border-2 border-gray-200 rounded-lg" required><option value="">Categoría...</option>{categories[formData.type]?.map(cat => (<option key={cat} value={cat}>{cat}</option>))}</select>
                                <input type="text" name="description" value={formData.description} onChange={handleFormChange} placeholder="Descripción" className="w-full p-3 border-2 border-gray-200 rounded-lg" required />
                                <input type="number" name="amount" value={formData.amount} onChange={handleFormChange} placeholder="Monto" className="w-full p-3 border-2 border-gray-200 rounded-lg" required />
                                <button type="submit" className="w-full text-white p-3 rounded-lg font-semibold transition-transform hover:scale-105" style={{ background: '#5a6268' }}>Agregar Movimiento</button>
                            </form>
                        </div>
                    </div>
                </div>

                <div className="p-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Historial de Movimientos</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 p-4 bg-gray-100 rounded-lg">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Filtrar por Mes</label>
                            <select name="month" value={filters.month} onChange={handleFilterChange} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm">
                                <option value="">Todos</option>
                                {[...Array(12)].map((_, i) => <option key={i+1} value={i+1}>{new Date(2000, i).toLocaleString('es-CO', { month: 'long' })}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Filtrar por Año</label>
                            <select name="year" value={filters.year} onChange={handleFilterChange} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm">
                                <option value="">Todos</option>
                                {yearsForFilter.map(year => <option key={year} value={year}>{year}</option>)}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Filtrar por Tipo</label>
                            <select name="type" value={filters.type} onChange={handleFilterChange} className="mt-1 block w-full p-2 border-gray-300 rounded-md shadow-sm">
                                <option value="">Todos</option>
                                <option value="income">Ingresos</option>
                                <option value="expense">Gastos</option>
                            </select>
                        </div>
                    </div>
                    <div className="overflow-x-auto shadow-md rounded-lg">
                        <table className="w-full text-sm text-left text-gray-500">
                            <thead className="text-xs text-white uppercase" style={{ background: 'linear-gradient(135deg, #444b1d 0%, #3a4019 100%)' }}>
                                <tr>
                                    <th scope="col" className="px-6 py-3">Fecha</th>
                                    <th scope="col" className="px-6 py-3">Tipo</th>
                                    <th scope="col" className="px-6 py-3">Categoría</th>
                                    <th scope="col" className="px-6 py-3">Descripción</th>
                                    <th scope="col" className="px-6 py-3">Método de Pago</th>
                                    <th scope="col" className="px-6 py-3">Monto</th>
                                    <th scope="col" className="px-6 py-3">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filteredTransactions.length > 0 ? filteredTransactions.map(t => (
                                    <tr key={t.id} className="bg-white border-b hover:bg-gray-50 align-top">
                                        <td className="px-6 py-4">{parseDate(t.date).toLocaleDateString('es-CO')}</td>
                                        <td className="px-6 py-4">{t.type === 'income' ? '💚 Ingreso' : '💸 Gasto'}</td>
                                        <td className="px-6 py-4">{t.category}</td>
                                        <td className="px-6 py-4 text-gray-800">
                                            {t.category === 'Ventas' && Array.isArray(t.items) ? (
                                                <div>
                                                    <p className="font-semibold">{t.description}</p>
                                                    <ul className="list-disc list-inside text-xs text-gray-600 mt-1 pl-1">
                                                        {t.items.map(item => (<li key={item.id}>{`${item.quantity} x ${item.name}`}</li>))}
                                                    </ul>
                                                </div>
                                            ) : (t.description)}
                                        </td>
                                        <td className="px-6 py-4">{t.metodoPago ? t.metodoPago : 'N/A'}</td>
                                        <td className={`px-6 py-4 font-bold ${t.type === 'income' ? 'text-green-600' : 'text-red-600'}`}>${t.amount.toLocaleString('es-CO')}</td>
                                        <td className="px-6 py-4">
                                            <button onClick={() => handleDeleteTransaction(t.id)} className="font-medium text-red-600 hover:underline">Eliminar</button>
                                        </td>
                                    </tr>
                                )) : (
                                    <tr><td colSpan="7" className="text-center py-10 text-gray-500">🎯 No hay movimientos para los filtros seleccionados.</td></tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ExpenseTracker;