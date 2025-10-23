import { AlertTriangle, Loader2 } from "lucide-react";

const ConfirmationModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title, 
  message,
  buttonText,
  isLoading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  buttonText: string;
  isLoading?: boolean;
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center mb-4">
          <AlertTriangle className="h-6 w-6 text-red-500 mr-3" />
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        </div>
        <p className="text-gray-600 mb-6">{message}</p>
        <div className="flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className={`px-4 py-2 text-gray-600 bg-gray-100 rounded-lg transition-colors ${
              isLoading 
                ? "opacity-50 cursor-not-allowed" 
                : "hover:bg-gray-200"
            }`}
          >
            Hủy
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className={`px-4 py-2 bg-red-500 text-white rounded-lg transition-colors flex items-center gap-2 ${
              isLoading
                ? "opacity-50 cursor-not-allowed"
                : "hover:bg-red-600"
            }`}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {buttonText}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmationModal;