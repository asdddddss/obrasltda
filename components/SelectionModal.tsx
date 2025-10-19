import React, { useState, useMemo } from 'react';
import { XMarkIcon, MagnifyingGlassIcon } from './icons/Icons';

interface SelectableItem {
  id: string;
  name: string;
  avatar?: string;
}

interface SelectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  items: SelectableItem[];
  selectedIds: string[];
  onApply: (selectedIds: string[]) => void;
}

const SelectionModal: React.FC<SelectionModalProps> = ({ isOpen, onClose, title, items, selectedIds, onApply }) => {
  const [internalSelection, setInternalSelection] = useState<string[]>(selectedIds);
  const [searchQuery, setSearchQuery] = useState('');

  // Sync internal state if external state changes while modal is open
  React.useEffect(() => {
    if (isOpen) {
      setInternalSelection(selectedIds);
    }
  }, [selectedIds, isOpen]);

  const filteredItems = useMemo(() => {
    if (!searchQuery) return items;
    return items.filter(item => item.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [items, searchQuery]);

  const handleToggle = (itemId: string) => {
    setInternalSelection(prev =>
      prev.includes(itemId) ? prev.filter(id => id !== itemId) : [...prev, itemId]
    );
  };

  const handleApply = () => {
    onApply(internalSelection);
    onClose();
  };
  
  const handleClear = () => {
      setInternalSelection([]);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-lg flex flex-col max-h-[80vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold">{title}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-4 border-b border-gray-200 dark:border-gray-800">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800"
            />
            <MagnifyingGlassIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div className="p-4 flex-grow overflow-y-auto scrollbar-hide">
          {filteredItems.length > 0 ? (
            <div className="space-y-2">
              {filteredItems.map(item => (
                <label key={item.id} className="flex items-center space-x-3 p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={internalSelection.includes(item.id)}
                    onChange={() => handleToggle(item.id)}
                    className="h-5 w-5 rounded border-gray-300 dark:border-gray-600 text-brand-600 focus:ring-brand-500 bg-white dark:bg-gray-900"
                  />
                  {item.avatar && <img src={item.avatar} alt={item.name} className="h-8 w-8 rounded-full" />}
                  <span>{item.name}</span>
                </label>
              ))}
            </div>
          ) : (
            <p className="text-center text-gray-500">Nenhum item encontrado.</p>
          )}
        </div>

        <div className="flex justify-between items-center p-4 border-t border-gray-200 dark:border-gray-800">
          <button onClick={handleClear} disabled={internalSelection.length === 0} className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline disabled:opacity-50 disabled:cursor-not-allowed">
            Limpar
          </button>
          <button onClick={handleApply} className="bg-brand-500 text-white font-bold py-2 px-6 rounded-lg hover:bg-brand-600">
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
};

export default SelectionModal;