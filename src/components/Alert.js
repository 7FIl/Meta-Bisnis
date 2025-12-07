'use client';

import { useState, useEffect } from 'react';
import { createContext, useContext } from 'react';

const AlertContext = createContext();

export function useAlert() {
  const context = useContext(AlertContext);
  if (!context) {
    throw new Error('useAlert must be used within AlertProvider');
  }
  return context;
}

// Alert Provider
export function AlertProvider({ children }) {
  const [alerts, setAlerts] = useState([]);
  const MAX_ALERTS = 3; // Batasan maksimal alert yang dapat ditampilkan

  const show = (title, message, onConfirm, onCancel, options = {}) => {
    const id = Date.now();

    // Jika sudah mencapai batas maksimal, hapus alert tertua terlebih dahulu
    setAlerts((prev) => {
      let newAlerts = [...prev];
      if (newAlerts.length >= MAX_ALERTS) {
        // Hapus alert pertama (tertua)
        newAlerts.shift();
      }

      newAlerts.push({
        id,
        title,
        message,
        onConfirm,
        onCancel,
        type: options.type || 'info', // 'info', 'success', 'warning', 'error'
        confirmText: options.confirmText || 'OK',
        cancelText: options.cancelText || 'Batal',
        hasCancel: options.hasCancel !== false, // default true
      });

      return newAlerts;
    });

    return id;
  };

  const remove = (id) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  const info = (title, message, onConfirm, onCancel, confirmText = 'OK', cancelText = 'Batal') =>
    show(title, message, onConfirm, onCancel, { type: 'info', confirmText, cancelText });

  const success = (title, message, onConfirm, onCancel, confirmText = 'OK', cancelText = 'Batal') =>
    show(title, message, onConfirm, onCancel, { type: 'success', confirmText, cancelText });

  const warning = (title, message, onConfirm, onCancel, confirmText = 'Keluar', cancelText = 'Batal') =>
    show(title, message, onConfirm, onCancel, { type: 'warning', confirmText, cancelText });

  const error = (title, message, onConfirm, onCancel, confirmText = 'OK', cancelText = 'Batal') =>
    show(title, message, onConfirm, onCancel, { type: 'error', confirmText, cancelText });

  return (
    <AlertContext.Provider value={{ show, remove, info, success, warning, error }}>
      {children}
      <AlertContainer alerts={alerts} onRemove={remove} />
    </AlertContext.Provider>
  );
}

// Alert Container
function AlertContainer({ alerts, onRemove }) {
  return (
    <>
      {alerts.map((alert) => (
        <AlertItem key={alert.id} alert={alert} onRemove={onRemove} />
      ))}
    </>
  );
}

// Individual Alert Item
function AlertItem({ alert, onRemove }) {
  const [isExiting, setIsExiting] = useState(false);

  const handleConfirm = () => {
    setIsExiting(true);
    setTimeout(() => {
      alert.onConfirm?.();
      onRemove(alert.id);
    }, 300);
  };

  const handleCancel = () => {
    setIsExiting(true);
    setTimeout(() => {
      alert.onCancel?.();
      onRemove(alert.id);
    }, 300);
  };

  const bgColor = {
    success: 'bg-teal-50 border-teal-200',    // BARU: TEAL
    error: 'bg-rose-50 border-rose-200',      // BARU: ROSE
    warning: 'bg-orange-50 border-orange-200',  // BARU: ORANGE
    info: 'bg-indigo-50 border-indigo-200',   // BARU: INDIGO
  }[alert.type];

  const titleColor = {
    success: 'text-teal-900',
    error: 'text-rose-900',
    warning: 'text-orange-900',
    info: 'text-indigo-900',
  }[alert.type];

  const messageColor = {
    // Diperbaiki untuk kontras yang lebih baik pada pesan
    success: 'text-teal-700',
    error: 'text-rose-700',
    warning: 'text-orange-700', 
    info: 'text-indigo-700',
  }[alert.type];

  const buttonBg = {
    // Latar belakang tombol utama
    success: 'bg-teal-600 hover:bg-teal-700',
    error: 'bg-rose-600 hover:bg-rose-700',
    warning: 'bg-orange-600 hover:bg-orange-700',
    info: 'bg-indigo-600 hover:bg-indigo-700',
  }[alert.type];

  const icon = {
    success: '✓',
    error: '✕',
    warning: '⚠',
    info: 'ℹ',
  }[alert.type];

  const iconBg = {
    // Latar belakang ikon
    success: 'bg-teal-100 text-teal-600',
    error: 'bg-rose-100 text-rose-600',
    warning: 'bg-orange-100 text-orange-600',
    info: 'bg-indigo-100 text-indigo-600',
  }[alert.type];

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black z-40 transition-opacity duration-300 ${isExiting ? 'opacity-0' : 'opacity-50'
          }`}
        onClick={handleCancel}
      />

      {/* Alert Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={`bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transition-all duration-300 ${isExiting ? 'opacity-0 scale-90' : 'opacity-100 scale-100'
            }`}
        >
          {/* Header dengan Icon */}
          <div className={`${bgColor} border-b-2 p-6 flex items-start gap-4`}>
            <div className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 ${iconBg} text-xl font-bold`}>
              {icon}
            </div>
            <div className="flex-1">
              <h3 className={`text-lg font-bold ${titleColor}`}>{alert.title}</h3>
            </div>
          </div>

          {/* Message Body */}
          <div className="p-6 bg-orange">
            <p className={`${messageColor} text-sm leading-relaxed`}>{alert.message}</p>
          </div>

          {/* Footer dengan Button */}
          <div className="px-6 pb-6 flex gap-3">
            {alert.hasCancel && (
              <button
                onClick={handleCancel}
                className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 text-gray-700 font-semibold hover:bg-gray-50 transition-all duration-200"
              >
                {alert.cancelText}
              </button>
            )}
            <button
              onClick={handleConfirm}
              className={`${alert.hasCancel ? 'flex-1' : 'w-full'} py-2.5 px-4 rounded-lg text-white font-semibold transition-all duration-200 ${buttonBg}`}
            >
              {alert.confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
