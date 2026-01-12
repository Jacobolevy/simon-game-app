/**
 * ConfirmModal - Compact Mobile App Style
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center"
      style={{
        /* This modal is fixed and bypasses AppShell padding. Respect safe areas. */
        paddingLeft: 'max(12px, env(safe-area-inset-left))',
        paddingRight: 'max(12px, env(safe-area-inset-right))',
        paddingTop: 'max(12px, env(safe-area-inset-top))',
        paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
      }}
    >
      {/* Backdrop */}
      <div 
        className={`absolute inset-0 bg-black/60 backdrop-blur-sm ${animationClass}`}
        onClick={onCancel}
      />
      
      {/* Modal - Compact */}
      <div 
        className={`
          relative w-full max-w-xs
          bg-gradient-to-b from-white/15 to-white/5
          backdrop-blur-xl rounded-xl
          border border-white/20
          shadow-2xl
          p-4
          ${animationClass}
        `}
      >
        {/* Title */}
        <h3 className="text-base font-semibold text-white mb-1">
          {title}
        </h3>
        
        {/* Message */}
        <p className="text-white/70 text-sm mb-4">
          {message}
        </p>
        
        {/* Actions */}
        <div className="flex gap-2">
          <button
            onClick={onCancel}
            className="
              flex-1 py-2.5 px-3
              bg-white/10 hover:bg-white/20
              rounded-lg font-medium text-sm text-white
              transition-all duration-200
              active:scale-95
            "
          >
            {cancelText}
          </button>
          
          <button
            onClick={onConfirm}
            className={`
              flex-1 py-2.5 px-3
              rounded-lg font-medium text-sm text-white
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
