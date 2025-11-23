import React from 'react';

interface DeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

export const DeleteModal: React.FC<DeleteModalProps> = ({ isOpen, onClose, onConfirm }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative z-20 flex w-full max-w-sm flex-col items-center justify-center overflow-hidden rounded-xl bg-white dark:bg-[#1C2A38] shadow-2xl m-4 animate-in fade-in zoom-in duration-200">
        <div className="flex flex-col items-center justify-center p-8 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
            <span className="material-symbols-outlined text-3xl text-red-500 dark:text-red-400">
              delete
            </span>
          </div>
          <h3 className="text-xl font-bold leading-tight tracking-tight text-[#111418] dark:text-gray-100">
            Deseja realmente excluir este item?
          </h3>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Esta ação não poderá ser desfeita. Todas as informações associadas a este item serão perdidas permanentemente.
          </p>
        </div>
        <div className="flex w-full flex-col gap-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#101922]/50 px-6 py-4 sm:flex-row-reverse">
          <button
            onClick={onConfirm}
            className="flex w-full sm:w-auto min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-11 px-5 bg-feedback-red text-white text-base font-bold leading-normal tracking-[0.015em] hover:bg-red-700 focus:ring-4 focus:ring-red-300 dark:focus:ring-red-800 transition-colors"
          >
            <span className="truncate">Sim, excluir</span>
          </button>
          <button
            onClick={onClose}
            className="flex w-full sm:w-auto min-w-[84px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-11 px-5 bg-white dark:bg-gray-600 text-[#111418] dark:text-gray-200 border border-gray-300 dark:border-gray-500 text-base font-bold leading-normal tracking-[0.015em] hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <span className="truncate">Cancelar</span>
          </button>
        </div>
      </div>
    </div>
  );
};
