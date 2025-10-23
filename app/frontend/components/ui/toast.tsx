import { cn } from "@/lib/utils";
import { CheckCircle, AlertCircle } from 'lucide-react';
import { useEffect } from 'react';

interface ToastProps {
  message: string;
  type: 'success' | 'error';
}

export default function Toast({ message, type }: ToastProps) {
  return (
    <div
      className={cn(
        'fixed top-4 right-4 z-50 p-4 rounded-lg shadow-lg flex items-center gap-2 animate-in slide-in-from-right',
        type === 'success' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'
      )}
    >
      {type === 'success' ? (
        <CheckCircle className="h-5 w-5" />
      ) : (
        <AlertCircle className="h-5 w-5" />
      )}
      <span>{message}</span>
    </div>
  );
}
export function Toast_2({ id, message, variant, onClose }: any & { onClose: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onClose(id), 3000);
    return () => clearTimeout(timer);
  }, [id, onClose]);

  return (
    <div
      className={cn(
        'fixed top-4 right-4 p-4 rounded-md shadow-lg text-white animate-in slide-in-from-right',
        variant === 'success' ? 'bg-green-600' : 'bg-red-600'
      )}
    >
      {message}
    </div>
  );
}