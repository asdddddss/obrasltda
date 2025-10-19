import React, { useState } from 'react';
import { User, Role } from '../types';
import { updateUser } from '../services/api';
import { XMarkIcon } from './icons/Icons';

interface UserEditorModalProps {
  user: User;
  currentUser: User;
  onClose: () => void;
  onSaveComplete: () => void;
}

const UserEditorModal: React.FC<UserEditorModalProps> = ({ user, currentUser, onClose, onSaveComplete }) => {
  const [role, setRole] = useState(user.role);
  const [birthdate, setBirthdate] = useState(user.birthdate ? user.birthdate.split('T')[0] : '');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const canChangeRole = currentUser.role === Role.ADMIN_MASTER;
  
  const handleSave = async () => {
    setError('');
    setIsLoading(true);

    try {
      const updates: Partial<User> = {
        birthdate: birthdate || undefined,
      };

      if (canChangeRole) {
        updates.role = role;
      }

      await updateUser(user.id, updates);
      onSaveComplete();
    } catch (err: any) {
      console.error("Failed to save user:", err);
      setError(err.message || 'Ocorreu um erro ao salvar as alterações.');
    } finally {
      setIsLoading(false);
    }
  };

  const commonInputClass = "mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm bg-white dark:bg-gray-800";

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-lg flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold">Editar Usuário: {user.name}</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 flex-grow overflow-y-auto space-y-4">
          <div>
            <label htmlFor="role" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Cargo</label>
            <select 
                id="role" 
                value={role} 
                onChange={(e) => setRole(e.target.value as Role)} 
                className={`${commonInputClass} disabled:opacity-50 disabled:bg-gray-100 dark:disabled:bg-gray-800`}
                disabled={!canChangeRole}
            >
              {Object.values(Role).map((r: Role) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
            {!canChangeRole && <p className="text-xs text-gray-500 mt-1">Apenas o ADMIN_MASTER pode alterar cargos.</p>}
          </div>
          <div>
            <label htmlFor="birthdate" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Data de Aniversário</label>
            <input 
                type="date" 
                id="birthdate" 
                value={birthdate} 
                onChange={(e) => setBirthdate(e.target.value)} 
                className={commonInputClass} 
            />
          </div>

          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>

        <div className="flex justify-end items-center p-4 border-t border-gray-200 dark:border-gray-800">
          <button onClick={onClose} className="text-gray-700 dark:text-gray-300 font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 mr-4">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={isLoading}
            className="bg-brand-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-600 disabled:bg-brand-300"
          >
            {isLoading ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserEditorModal;