'use client';

import { useState, useEffect } from 'react';

// Context untuk Dialog
import { createContext, useContext } from 'react';

const DialogContext = createContext();

export function useConfirm() {
  const context = useContext(DialogContext);
  if (!context) {
    throw new Error('useConfirm must be used within ConfirmDialogProvider');
  }
  return context;
}

// Dialog Provider
export function ConfirmDialogProvider({ children }) {
  const [dialog, setDialog] = useState(null);

  const confirm = (title, message, onConfirm, onCancel, options = {}) => {
    return new Promise((resolve) => {
      setDialog({
        title,
        message,
        onConfirm: () => {
          onConfirm?.();
          setDialog(null);
          resolve(true);
        },
        onCancel: () => {
          onCancel?.();
          setDialog(null);
          resolve(false);
        },
        confirmText: options.confirmText || 'Konfirmasi',
        cancelText: options.cancelText || 'Batal',
        isDangerous: options.isDangerous || false,
      });
    });
  };

  return (
    <DialogContext.Provider value={{ confirm }}>
      {children}
      {dialog && <ConfirmDialogComponent {...dialog} />}
    </DialogContext.Provider>
  );
}

// Dialog Component
function ConfirmDialogComponent({ title, message, onConfirm, onCancel, confirmText, cancelText, isDangerous }) {
  const [isExiting, setIsExiting] = useState(false);

  const handleConfirm = () => {
    setIsExiting(true);
    setTimeout(onConfirm, 200);
  };

  const handleCancel = () => {
    setIsExiting(true);
    setTimeout(onCancel, 200);
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black z-40 transition-opacity duration-200 ${isExiting ? 'opacity-0' : 'opacity-50'
          }`}
        onClick={handleCancel}
      />

      {/* Dialog */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className={`bg-white rounded-2xl shadow-2xl max-w-sm w-full p-6 transition-all duration-200 ${isExiting ? 'opacity-0 scale-95' : 'opacity-100 scale-100'
            }`}
        >
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div
              className={`w-16 h-16 rounded-full flex items-center justify-center ${isDangerous ? 'bg-red-100' : 'bg-blue-100'
                }`}
            >
              <span className={`text-3xl ${isDangerous ? 'text-red-600' : 'text-blue-600'}`}>
                {isDangerous ? '⚠' : '❓'}
              </span>
            </div>
          </div>

          {/* Title */}
          <h2 className="text-xl font-bold text-center text-gray-900 mb-2">{title}</h2>

          {/* Message */}
          <p className="text-center text-gray-600 mb-6">{message}</p>

          {/* Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              className="flex-1 py-2.5 px-4 rounded-lg border border-gray-300 text-gray-700 font-medium hover:bg-gray-50 transition-colors duration-200"
            >
              {cancelText}
            </button>
            <button
              onClick={handleConfirm}
              className={`flex-1 py-2.5 px-4 rounded-lg text-white font-medium transition-colors duration-200 ${isDangerous
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-blue-600 hover:bg-blue-700'
                }`}
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
