import { X } from "lucide-react";

interface ConfirmDialogProps {
  title: string;
  message: string;
  confirmButtonText: string;
  cancelButtonText: string;
  isConfirmDestructive?: boolean;
  isConfirmLoading?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function ConfirmDialog({
  title,
  message,
  confirmButtonText,
  cancelButtonText,
  isConfirmDestructive = false,
  isConfirmLoading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 backdrop-blur-sm bg-black bg-opacity-50">
      <div className="card-background rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        <div className="flex justify-between items-center p-4 border-b border-gray-700">
          <h3 className="text-lg font-semibold">{title}</h3>
          <button
            onClick={onCancel}
            className="p-1 rounded-full hover:cursor-pointer"
            disabled={isConfirmLoading}
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6">
          <p className="mb-6">{message}</p>

          <div className="flex justify-end gap-3">
            <button
              onClick={onCancel}
              className="px-4 py-2 submit-button text-white rounded-lg hover:cursor-pointer"
              disabled={isConfirmLoading}
            >
              {cancelButtonText}
            </button>

            <button
              onClick={onConfirm}
              className={`px-4 py-2 rounded-lg ${
                isConfirmDestructive
                  ? "bg-red-500 hover:bg-red-400 text-white hover:cursor-pointer h"
                  : "submit-button text-white"
              }`}
              disabled={isConfirmLoading}
            >
              {isConfirmLoading ? (
                <div className="flex items-center">
                  <div className="animate-spin h-4 w-4 border-2 border-white rounded-full mr-2"></div>
                  {confirmButtonText}
                </div>
              ) : (
                confirmButtonText
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
