import type { ReactNode } from 'react';

import { X } from 'lucide-react';

type ModalProps = {
  title?: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  footerInside?: boolean;
};

export function Modal({ title, children, onClose, footer, footerInside }: ModalProps) {
  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-modal="true" role="dialog">
      <div className="flex min-h-screen items-end justify-center px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-black/40 backdrop-blur-[1px] transition-opacity"
          aria-hidden="true"
          onClick={onClose}
        />
        <span className="hidden sm:inline-block sm:h-screen sm:align-middle" aria-hidden="true">
          &#8203;
        </span>
        <div className="relative inline-block w-full transform overflow-hidden rounded-lg bg-white px-4 pt-5 pb-4 text-left align-bottom shadow-xl transition-all sm:my-8 sm:max-w-lg sm:align-middle sm:w-full sm:p-6">
          <button
            type="button"
            onClick={onClose}
            className="absolute top-2 right-2 p-2 text-gray-400 hover:text-gray-600"
            aria-label="Close"
          >
            <X className="h-5 w-5" />
          </button>

          {title ? (
            <div className="pt-6 text-center">
              <h3 className="text-lg leading-6 font-medium text-gray-900">{title}</h3>
            </div>
          ) : null}

          <div className={title ? 'mt-3' : 'pt-6'}>{children}</div>

          {!footerInside && footer ? <div className="mt-5 sm:mt-6">{footer}</div> : null}
        </div>
      </div>
    </div>
  );
}
