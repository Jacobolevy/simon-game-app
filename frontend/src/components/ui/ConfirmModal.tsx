/**
 * ConfirmModal Component
 * 
 * Generic confirmation dialog with customizable actions.
 */

import { useAnimation } from '../../hooks/useAnimation';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
  /** Danger mode (red confirm button) */
  danger?: boolean;
}

export function ConfirmModal({
  isOpen,
  title,
  message,
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
  danger = false,
}: ConfirmModalProps) {
  const { shouldRender, isEntering, isExiting } = useAnimation(isOpen, {
    enterDuration: 200,
    exitDuration: 150,
  });

  if (!shouldRender) return null;

  const animationClass = isEntering 
    ? 'animate-in fade-in zoom-in-95 duration-200' 
    : isExiting 
    ? 'animate-out fade-out zoom-out-95 duration-150'
    : '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${animationClass}`}
        onClick={onCancel}
      />
      
      {/* Modal */}
      <div 
        className={`
          relative w-full max-w-sm
          bg-gradient-to-b from-white/15 to-white/5
          backdrop-blur-xl rounded-2xl
          border border-white/20
          shadow-2xl
          p-6
          ${animationClass}
        `}
      >
        {/* Title */}
        <h3 className="text-xl font-semibold text-white mb-2">
          {title}
        </h3>
        
        {/* Message */}
        <p className="text-white/70 mb-6">
          {message}
        </p>
        
        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onCancel}
            className="
              flex-1 py-3 px-4
              bg-white/10 hover:bg-white/20
              rounded-xl font-medium text-white
              transition-all duration-200
              active:scale-95
            "
          >
            {cancelText}
          </button>
          
          <button
            onClick={onConfirm}
            className={`
              flex-1 py-3 px-4
              rounded-xl font-medium text-white
              transition-all duration-200
              active:scale-95
              ${danger 
                ? 'bg-red-500/80 hover:bg-red-500' 
                : 'bg-blue-500/80 hover:bg-blue-500'
              }
            `}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}

export default ConfirmModal;
