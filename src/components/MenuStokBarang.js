// src/components/MenuStokBarang.js
'use client';

import { useMemo, useState } from 'react';
import { useToast } from './Toast'; // Menggunakan Toast component yang sudah tersedia

export default function MenuStokBarang({
  businessName = "Bisnis Anda",
  stockItems = [], // [{ id, name, qty, unit, price }]
  onAddStockItem,
  onUpdateStockItem,
  onDeleteStockItem,
}) {
  const toast = useToast();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItem, setNewItem] = useState({
    name: '',
    qty: 0,
    unit: 'pcs',
    price: 0,
  });

  const currency = (v) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);

  const totals = useMemo(() => {
    const totalItems = stockItems.reduce((sum, item) => sum + (item.qty || 0), 0);
    const totalValue = stockItems.reduce((sum, item) => sum + (item.qty || 0) * (item.price || 0), 0);
    return { totalItems, totalValue };
  }, [stockItems]);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newItem.name.trim() || newItem.qty <= 0 || newItem.price <= 0) {
      toast.error('Mohon isi Nama, Jumlah > 0, dan Harga Beli > 0.');
      return;
    }

    onAddStockItem({
      ...newItem,
      qty: parseInt(newItem.qty),
      price: parseInt(newItem.price),
    });

    setNewItem({ name: '', qty: 0, unit: 'pcs', price: 0 });
    setShowAddForm(false);
    toast.success('Stok baru berhasil ditambahkan!');
  };

  const handleDelete = (id) => {
    onDeleteStockItem(id);
    toast.info('Item stok dihapus.');
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-xl font-bold">Stok Barang</h3>
          <div className="text-sm text-slate-500">{businessName}</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="text-sm bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-lg"
          >
            <i className="fas fa-plus mr-1"></i>
            {showAddForm ? 'Batal' : 'Tambah Stok'}
          </button>
        </div>
      </div>

      {/* Summary Card */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <div className="p-4 border border-slate-100 dark:border-slate-700 rounded-lg bg-indigo-50 dark:bg-slate-800">
          <div className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Total Jenis Barang</div>
          <div className="block text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">{stockItems.length}</div>
        </div>
        <div className="p-4 border border-slate-100 dark:border-slate-700 rounded-lg bg-green-50 dark:bg-slate-800">
          <div className="block text-sm font-semibold text-slate-700 dark:text-slate-200">Total Nilai Stok</div>
          <div className="block text-xl font-bold text-slate-800 dark:text-slate-100 mt-1">{currency(totals.totalValue)}</div>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="mb-6 p-4 border border-blue-300 rounded-lg bg-blue-50 dark:bg-slate-700 space-y-3">
          <h4 className="text-lg font-bold text-blue-800 dark:text-blue-200 mb-3">Input Barang Baru</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Nama Barang</label>
              <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="Cth: Kopi Arabika Gayo"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Jumlah</label>
              <input
                type="number"
                value={newItem.qty}
                onChange={(e) => setNewItem({ ...newItem, qty: e.target.value })}
                min="0"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Satuan</label>
              <input
                type="text"
                value={newItem.unit}
                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                placeholder="pcs/kg/liter"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Harga Beli Satuan (Rp)</label>
              <input
                type="number"
                value={newItem.price}
                onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                min="0"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800"
              />
            </div>
            <div className='md:col-span-2 flex items-end'>
                <button
                    type="submit"
                    disabled={!newItem.name.trim() || newItem.qty <= 0 || newItem.price <= 0}
                    className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-slate-400 text-white py-2 rounded-lg font-medium transition"
                >
                    Simpan Stok
                </button>
            </div>
          </div>
        </form>
      )}

      {/* Stock List */}
      <div className="mb-6">
        <h3 className="text-lg font-bold mb-3">Daftar Inventaris ({totals.totalItems} unit)</h3>
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-500 rounded-lg">
          <table className="w-full text-sm">
            <thead className="p-4 bg-slate-50 dark:bg-slate-700 text-left">
              <tr>
                <th className="px-3 py-2 text-slate-700 dark:text-slate-200">Nama Barang</th>
                <th className="px-3 py-2 text-slate-700 dark:text-slate-200">Jumlah</th>
                <th className="px-3 py-2 text-slate-700 dark:text-slate-200">Harga Satuan Beli</th>
                <th className="px-3 py-2 text-slate-700 dark:text-slate-200">Nilai Total</th>
                <th className="px-3 py-2 text-slate-700 dark:text-slate-200">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-800">
              {stockItems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-slate-500 dark:text-slate-400">
                    Belum ada barang di stok. Tambahkan item di atas.
                  </td>
                </tr>
              ) : (
                stockItems.map((item) => (
                  <tr key={item.id} className="border-t border-slate-100 dark:border-slate-700">
                    <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-200">{item.name}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{item.qty} {item.unit}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-300">{currency(item.price)}</td>
                    <td className="px-3 py-2 font-semibold text-green-700 dark:text-green-400">{currency(item.qty * item.price)}</td>
                    <td className="px-3 py-2">
                        <button 
                            onClick={() => handleDelete(item.id)}
                            className="text-red-500 hover:text-red-700"
                            title="Hapus Item"
                        >
                            <i className="fas fa-trash-alt"></i>
                        </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}