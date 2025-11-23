import React from 'react';
import { InventoryItem } from '../types';

interface ProductCardProps {
  product: InventoryItem;
  onDelete: (id: string) => void;
  onEdit: (id: string) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onDelete, onEdit }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  // Force local time interpretation to avoid UTC timezone shifts (e.g. 3 hours difference)
  const expiry = new Date(`${product.expiry_date}T00:00:00`);
  expiry.setHours(0, 0, 0, 0);

  const diffTime = expiry.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

  let statusColor = 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400';
  let statusText = `Vence em: ${expiry.toLocaleDateString('pt-BR')}`;
  let borderColor = '';

  if (diffDays < 0) {
    statusColor = 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400';
    statusText = `Vencido em: ${expiry.toLocaleDateString('pt-BR')}`;
    borderColor = 'border-l-4 border-red-600';
  } else if (diffDays === 0) {
    statusColor = 'bg-red-100 text-red-600 dark:bg-red-900/50 dark:text-red-400';
    statusText = 'Val: Hoje';
    borderColor = 'border-l-4 border-red-600';
  } else if (diffDays <= 7) {
    statusColor = 'bg-amber-100 text-amber-600 dark:bg-amber-900/50 dark:text-amber-400';
    borderColor = 'border-l-4 border-amber-500';
  } else if (diffDays <= 30) {
    statusColor = 'bg-orange-100 text-orange-600 dark:bg-orange-900/50 dark:text-orange-400';
    borderColor = 'border-l-4 border-orange-500';
  }

  return (
    <div className={`flex flex-col gap-2 bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm ${borderColor}`}>
      <div className="flex flex-col justify-center">
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <p className="text-gray-900 dark:text-gray-100 text-base font-medium">Código: {product.product_code}</p>
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-sm font-bold ${statusColor}`}>
            {statusText}
          </span>
        </div>
        <p className="text-gray-900 dark:text-gray-100 text-base font-medium leading-normal mt-1">
          Qtd: {product.quantity}
        </p>
        <p className="text-gray-500 dark:text-gray-400 text-sm font-normal leading-normal mt-1" title={product.product_description}>
          {(product.product_description || 'Produto sem descrição').length > 30
            ? `${(product.product_description || 'Produto sem descrição').substring(0, 30)}...`
            : (product.product_description || 'Produto sem descrição')}
        </p>
      </div>
      <div className="flex justify-end gap-3 pt-2 border-t border-gray-200 dark:border-gray-700 mt-2">
        <button
          onClick={() => onDelete(product.id)}
          className="flex items-center justify-center overflow-hidden rounded-lg h-9 px-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium leading-normal hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          <span className="material-symbols-outlined text-base mr-1">delete</span>
          <span className="truncate">Excluir</span>
        </button>
        <button
          onClick={() => onEdit(product.id)}
          className="flex items-center justify-center overflow-hidden rounded-lg h-9 px-3 bg-gray-200 dark:bg-gray-700 text-gray-800 dark:text-gray-200 text-sm font-medium leading-normal hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
        >
          <span className="material-symbols-outlined text-base mr-1">edit</span>
          <span className="truncate">Editar</span>
        </button>
      </div>
    </div>
  );
};
