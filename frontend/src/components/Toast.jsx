import React from 'react';
import { CheckCircle2, AlertCircle, Info, X } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export const Toast = () => {
  const { toastMessage } = useAuth();

  if (!toastMessage) return null;

  const { message, type } = toastMessage;

  const styles = {
    success: 'bg-emerald-50 text-emerald-800 border-emerald-200 icon-emerald',
    error: 'bg-rose-50 text-rose-800 border-rose-200 icon-rose',
    info: 'bg-blue-50 text-blue-800 border-blue-200 icon-blue',
  };

  const currentStyle = styles[type] || styles.info;

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-sm w-full animate-bounce-in">
      <div className={`flex items-start p-4 rounded-xl border shadow-lg ${currentStyle}`}>
        <div className="mr-3 mt-0.5">
          {type === 'success' && <CheckCircle2 className="w-5 h-5 text-emerald-600" />}
          {type === 'error' && <AlertCircle className="w-5 h-5 text-rose-600" />}
          {type === 'info' && <Info className="w-5 h-5 text-blue-600" />}
        </div>
        <div className="flex-1 text-sm font-medium">{message}</div>
      </div>
    </div>
  );
};

