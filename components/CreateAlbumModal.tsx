import React, { useState } from 'react';
import { Album, User, Role } from '../types';
import { createAlbum } from '../services/api';
import { XMarkIcon } from './icons/Icons';

interface CreateAlbumModalProps {
  currentUser: User;
  onClose: () => void;
  onCreateComplete: (newAlbum: Album) => void;
}

const CreateAlbumModal: React.FC<CreateAlbumModalProps> = ({ currentUser, onClose, onCreateComplete }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [permission, setPermission] = useState<Role>(Role.MEMBER);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = async () => {
    if (!title) {
        setError('O título do álbum é obrigatório.');
        return;
    }
    setError('');
    setIsCreating(true);
    try {
      const newAlbum = await createAlbum({ title, description, permission }, currentUser);
      onCreateComplete(newAlbum);
    } catch (err) {
      console.error("Failed to create album:", err);
      setError('Ocorreu um erro ao criar o álbum. Tente novamente.');
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 w-full max-w-lg rounded-lg flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold">Criar Novo Álbum</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 flex-grow overflow-y-auto space-y-4">
          <div>
            <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Título</label>
            <input
              type="text"
              name="title"
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm bg-white dark:bg-gray-800"
              placeholder="Ex: Férias na Praia"
            />
          </div>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Descrição</label>
            <textarea
              name="description"
              id="description"
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="mt-1 block w-full border border-gray-300 dark:border-gray-700 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm bg-white dark:bg-gray-800"
              placeholder="Uma breve descrição do que aconteceu..."
            />
          </div>
          <div>
            <label htmlFor="permission" className="block text-sm font-medium text-gray-700 dark:text-gray-300">Quem pode ver?</label>
            <select
                id="permission"
                name="permission"
                value={permission}
                onChange={(e) => setPermission(e.target.value as Role)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 dark:border-gray-700 focus:outline-none focus:ring-brand-500 focus:border-brand-500 sm:text-sm rounded-md bg-white dark:bg-gray-800"
            >
                <option value={Role.READER}>Qualquer um (Público)</option>
                <option value={Role.MEMBER}>Apenas Membros</option>
                <option value={Role.ADMIN}>Apenas Admins</option>
            </select>
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
        </div>

        <div className="flex justify-end items-center p-4 border-t border-gray-200 dark:border-gray-800">
          <button onClick={onClose} className="text-gray-700 dark:text-gray-300 font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 mr-4">
            Cancelar
          </button>
          <button
            onClick={handleCreate}
            disabled={isCreating}
            className="bg-brand-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed"
          >
            {isCreating ? 'Criando...' : 'Criar Álbum'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default CreateAlbumModal;