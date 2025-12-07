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
  const [editingId, setEditingId] = useState(null);
  const [newItem, setNewItem] = useState({
    kodeBarang: '',
    name: '',
    qty: 0,
    unit: 'pcs',
    buyPrice: 0,
    sellPrice: 0,
  });

  const currency = (v) =>
    new Intl.NumberFormat("id-ID", { style: "currency", currency: "IDR", maximumFractionDigits: 0 }).format(v);

  const totals = useMemo(() => {
    const totalItems = stockItems.reduce((sum, item) => sum + (item.qty || 0), 0);
    const totalValue = stockItems.reduce((sum, item) => sum + (item.qty || 0) * (item.buyPrice || item.price || 0), 0);
    return { totalItems, totalValue };
  }, [stockItems]);

  const handleAddSubmit = (e) => {
    e.preventDefault();
    if (!newItem.kodeBarang.trim() || !newItem.name.trim() || newItem.qty <= 0 || newItem.buyPrice <= 0 || newItem.sellPrice <= 0) {
      toast.error('Mohon isi Kode, Nama, Jumlah > 0, Harga Beli & Jual > 0.');
      return;
    }

    const payload = {
      ...newItem,
      qty: parseInt(newItem.qty),
      buyPrice: parseInt(newItem.buyPrice),
      sellPrice: parseInt(newItem.sellPrice),
    };

    if (editingId) {
      onUpdateStockItem({ ...payload, id: editingId });
      toast.success('Stok berhasil diperbarui!');
    } else {
      onAddStockItem({ ...payload, id: newItem.kodeBarang });
      toast.success('Stok baru berhasil ditambahkan!');
    }

    setNewItem({ kodeBarang: '', name: '', qty: 0, unit: 'pcs', buyPrice: 0, sellPrice: 0 });
    setEditingId(null);
    setShowAddForm(false);
  };

  const handleDelete = (id) => {
    onDeleteStockItem(id);
    toast.info('Item stok dihapus.');
  };

  const startEdit = (item) => {
    setShowAddForm(true);
    setEditingId(item.id);
    setNewItem({
      kodeBarang: item.kodeBarang || '',
      name: item.name || '',
      qty: item.qty || 0,
      unit: item.unit || 'pcs',
      buyPrice: item.buyPrice || item.price || 0,
      sellPrice: item.sellPrice || 0,
    });
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-700">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-1 font-bold">Stok Barang</h3>
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
        <div className="p-4 border border-slate-100 dark:border-slate-700 rounded-lg">
          <div className="block text-sm font-semibold text-slate-700 dark:text-slate-900">Total Jenis Barang</div>
          <div className="block text-l font-bold text-slate-800 dark:text-slate-900 mt-1">{stockItems.length}</div>
        </div>
        <div className="p-4 border border-slate-100 dark:border-slate-700 rounded-lg">
          <div className="block text-sm font-semibold text-slate-700 dark:text-slate-900">Total Nilai Stok</div>
          <div className="block text-l font-bold text-slate-800 dark:text-slate-900 mt-1">{currency(totals.totalValue)}</div>
        </div>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <form onSubmit={handleAddSubmit} className="p-4 border border-slate-100 dark:border-slate-700 rounded-lg mb-6 bg-slate-0 dark:bg-slate-00">
          <h4 className="text-lg font-bold text-white-00 dark:text-white-800 mb-3">{editingId ? 'Edit Barang' : 'Input Barang Baru'}</h4>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-900 mb-1">Kode Barang</label>
              <input
                type="text"
                value={newItem.kodeBarang}
                onChange={(e) => setNewItem({ ...newItem, kodeBarang: e.target.value })}
                placeholder="Cth: BRG001"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-900 mb-1">Nama Barang</label>
              <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                placeholder="Cth: Kopi Arabika Gayo"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-900 mb-1">Jumlah</label>
              <input
                type="number"
                value={newItem.qty}
                onChange={(e) => setNewItem({ ...newItem, qty: e.target.value })}
                min="0"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-900 mb-1">Satuan</label>
              <input
                type="text"
                value={newItem.unit}
                onChange={(e) => setNewItem({ ...newItem, unit: e.target.value })}
                placeholder="pcs/kg/liter"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-900 mb-1">Harga Beli Satuan (Rp)</label>
              <input
                type="number"
                value={newItem.buyPrice}
                onChange={(e) => setNewItem({ ...newItem, buyPrice: e.target.value })}
                min="0"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-900 mb-1">Harga Jual Satuan (Rp)</label>
              <input
                type="number"
                value={newItem.sellPrice}
                onChange={(e) => setNewItem({ ...newItem, sellPrice: e.target.value })}
                min="0"
                className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white text-slate-800"
              />
            </div>
            <div className='md:col-span-4 flex items-end'>
                <button
                    type="submit"
                    disabled={!newItem.kodeBarang.trim() || !newItem.name.trim() || newItem.qty <= 0 || newItem.buyPrice <= 0 || newItem.sellPrice <= 0}
                    className="w-full bg-blue-600 hover:bg-blue-800 disabled:bg-slate-00 text-white py-2 rounded-lg font-medium transition"
                >
                    {editingId ? 'Perbarui Stok' : 'Simpan Stok'}
                </button>
            </div>
          </div>
        </form>
      )}

      {/* Stock List */}
      <div className="mb-6">
        <h3 className="text-1 font-bold mb-3">Daftar Inventaris ({totals.totalItems} unit)</h3>
        <div className="overflow-x-auto border border-slate-200 dark:border-slate-500 rounded-lg">
          <table className="w-full text-sm ">
            <thead className="p-4 border border-slate-100 dark:border-slate-100 rounded-lg text-left">
              <tr>
                <th className="px-3 py-2 text-slate-700 dark:text-slate-900">Kode</th>
                <th className="px-3 py-2 text-slate-700 dark:text-slate-900">Nama Barang</th>
                <th className="px-3 py-2 text-slate-700 dark:text-slate-900">Jumlah</th>
                <th className="px-3 py-2 text-slate-700 dark:text-slate-900">Harga Beli</th>
                <th className="px-3 py-2 text-slate-700 dark:text-slate-900">Harga Jual</th>
                <th className="px-3 py-2 text-slate-700 dark:text-slate-900">Nilai Total</th>
                <th className="px-3 py-2 text-slate-700 dark:text-slate-900">Aksi</th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-slate-50">
              {stockItems.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-4 text-slate-500 dark:text-slate-400">
                    Belum ada barang di stok. Tambahkan item di atas.
                  </td>
                </tr>
              ) : (
                stockItems.map((item, idx) => (
                  <tr
                    key={item.id || item.kodeBarang || item.name || `stok-${idx}`}
                    className="border-t border-slate-100 dark:border-slate-700"
                  >
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-900">{item.kodeBarang || '-'}</td>
                    <td className="px-3 py-2 font-medium text-slate-800 dark:text-slate-900">{item.name}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-900">{item.qty} {item.unit}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-900">{currency(item.buyPrice || item.price || 0)}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-900">{currency(item.sellPrice || 0)}</td>
                    <td className="px-3 py-2 text-slate-700 dark:text-slate-900">{currency((item.qty || 0) * (item.buyPrice || item.price || 0))}</td>
                    <td className="px-3 py-2">
                        <div className="flex gap-3">
                          <button 
                              onClick={() => startEdit(item)}
                              className="text-blue-500 hover:text-blue-700"
                              title="Edit Item"
                          >
                              <i className="fas fa-edit"></i>
                          </button>
                          <button 
                              onClick={() => handleDelete(item.id)}
                              className="text-red-500 hover:text-red-700"
                              title="Hapus Item"
                          >
                              <i className="fas fa-trash-alt"></i>
                          </button>
                        </div>
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