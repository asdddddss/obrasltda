import React, { useState, useEffect } from 'react';
import { Album, User, MediaItem, Role } from '../types';
import { addMediaItems, getAllVisibleAlbums, createAlbum } from '../services/api';
import { XMarkIcon, CloudArrowUpIcon } from './icons/Icons';

interface UploadModalProps {
  currentUser: User;
  onClose: () => void;
  onUploadComplete: (newMedia: MediaItem[]) => void;
}

interface Preview {
    url: string;
    file: File;
    type: 'image' | 'video';
}

type SelectionMode = 'existing' | 'new' | 'none';

const UploadModal: React.FC<UploadModalProps> = ({ currentUser, onClose, onUploadComplete }) => {
  const [previews, setPreviews] = useState<Preview[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [userAlbums, setUserAlbums] = useState<Album[]>([]);
  const [isLoadingAlbums, setIsLoadingAlbums] = useState(true);
  
  const [selectionMode, setSelectionMode] = useState<SelectionMode>('existing');
  const [selectedAlbumId, setSelectedAlbumId] = useState<string>('');
  
  // New album state
  const [newAlbumTitle, setNewAlbumTitle] = useState('');
  const [newAlbumError, setNewAlbumError] = useState('');
  
  useEffect(() => {
    getAllVisibleAlbums(currentUser)
      .then((albums) => {
        setUserAlbums(albums);
        if (albums.length > 0) {
          setSelectedAlbumId(albums[0].id);
        } else {
          setSelectionMode('new'); // Default to creating a new album if none exist
        }
      })
      .finally(() => setIsLoadingAlbums(false));
  }, [currentUser]);

  useEffect(() => {
    return () => {
      previews.forEach(p => URL.revokeObjectURL(p.url));
    };
  }, [previews]);

  const handleFileChange = (selectedFiles: FileList | null) => {
    if (selectedFiles) {
      const newFiles = Array.from(selectedFiles);
      const newPreviews: Preview[] = newFiles.map(file => ({
          url: URL.createObjectURL(file),
          file,
          type: file.type.startsWith('video/') ? 'video' : 'image'
      }));
      setPreviews(prev => [...prev, ...newPreviews]);
    }
  };

  const removeFile = (index: number) => {
    URL.revokeObjectURL(previews[index].url);
    setPreviews(prev => prev.filter((_, i) => i !== index));
  };
  
  const handleUpload = async () => {
    if (previews.length === 0) return;
    
    let finalAlbumId: string | undefined = undefined;
    setIsUploading(true);

    try {
        if (selectionMode === 'new') {
            if (!newAlbumTitle.trim()) {
                setNewAlbumError('O título do novo álbum é obrigatório.');
                setIsUploading(false);
                return;
            }
            const newAlbum = await createAlbum({ title: newAlbumTitle, description: '', permission: Role.MEMBER }, currentUser);
            finalAlbumId = newAlbum.id;
        } else if (selectionMode === 'existing') {
            finalAlbumId = selectedAlbumId;
        }
        // If 'none', finalAlbumId remains undefined

        const filesToUpload = previews.map(p => p.file);
        const newMedia = await addMediaItems(filesToUpload, currentUser, finalAlbumId);
        onUploadComplete(newMedia);

    } catch (error) {
        console.error("Upload failed:", error);
    } finally {
        setIsUploading(false);
    }
  };

  const onDragOver = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(true); };
  const onDragLeave = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); };
  const onDrop = (e: React.DragEvent<HTMLDivElement>) => { e.preventDefault(); setIsDragging(false); handleFileChange(e.dataTransfer.files); };

  const canUpload = previews.length > 0 && !isUploading && (selectionMode === 'none' || (selectionMode === 'existing' && selectedAlbumId) || (selectionMode === 'new' && newAlbumTitle.trim()));

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-900 w-full max-w-2xl rounded-lg flex flex-col max-h-[90vh]">
        <div className="flex justify-between items-center p-4 border-b border-gray-200 dark:border-gray-800">
          <h2 className="text-xl font-bold">Adicionar Foto/Vídeo</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        <div className="p-6 flex-grow overflow-y-auto space-y-4">
          <div 
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${isDragging ? 'border-brand-500 bg-brand-50 dark:bg-brand-900/20' : 'border-gray-300 dark:border-gray-700'}`}
            onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}
          >
            <CloudArrowUpIcon className="h-12 w-12 mx-auto text-gray-400" />
            <p className="mt-4 text-gray-600 dark:text-gray-300">Arraste e solte arquivos aqui ou</p>
            <label htmlFor="file-upload" className="cursor-pointer text-brand-600 dark:text-brand-400 font-semibold hover:underline mt-1 inline-block">procure nos seus arquivos</label>
            <input id="file-upload" name="file-upload" type="file" multiple accept="image/*,video/*" className="sr-only" onChange={(e) => handleFileChange(e.target.files)} />
          </div>

          {previews.length > 0 && (
            <div className="mt-6">
              <h3 className="font-semibold mb-2">Pré-visualização ({previews.length})</h3>
              <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-4">
                {previews.map((preview, index) => (
                  <div key={index} className="relative aspect-square">
                    {preview.type === 'image' ? (
                        <img src={preview.url} alt={`Preview ${index}`} className="w-full h-full object-cover rounded-lg" />
                    ) : (
                        <video src={preview.url} className="w-full h-full object-cover rounded-lg" muted loop playsInline />
                    )}
                    <button onClick={() => removeFile(index)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full h-6 w-6 flex items-center justify-center text-sm font-bold">
                      <XMarkIcon className="h-4 w-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h3 className="font-semibold mb-3">Onde publicar?</h3>
            <div className="space-y-3">
              <label className="flex items-center space-x-3 p-3 border dark:border-gray-700 rounded-lg">
                <input type="radio" name="album-option" checked={selectionMode === 'existing'} onChange={() => setSelectionMode('existing')} className="h-4 w-4 text-brand-600 border-gray-300 focus:ring-brand-500" disabled={isLoadingAlbums || userAlbums.length === 0} />
                <span className="text-sm font-medium">Publicar em um álbum existente</span>
              </label>
              {selectionMode === 'existing' && (
                  <div className="pl-9">
                    {isLoadingAlbums ? <p className="text-sm">Carregando álbuns...</p> : userAlbums.length > 0 ? (
                        <select value={selectedAlbumId} onChange={(e) => setSelectedAlbumId(e.target.value)} className="block w-full text-sm border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:ring-brand-500 focus:border-brand-500">
                            {userAlbums.map(a => <option key={a.id} value={a.id}>{a.title}</option>)}
                        </select>
                    ) : <p className="text-sm text-gray-500">Nenhum álbum disponível.</p>}
                  </div>
              )}
               <label className="flex items-center space-x-3 p-3 border dark:border-gray-700 rounded-lg">
                <input type="radio" name="album-option" checked={selectionMode === 'new'} onChange={() => { setSelectionMode('new'); setNewAlbumError(''); }} className="h-4 w-4 text-brand-600 border-gray-300 focus:ring-brand-500" />
                <span className="text-sm font-medium">Criar um novo álbum</span>
              </label>
              {selectionMode === 'new' && (
                  <div className="pl-9">
                     <input type="text" value={newAlbumTitle} onChange={(e) => { setNewAlbumTitle(e.target.value); setNewAlbumError(''); }} placeholder="Título do novo álbum" className="block w-full text-sm border-gray-300 dark:border-gray-700 rounded-md bg-white dark:bg-gray-800 focus:ring-brand-500 focus:border-brand-500" />
                     {newAlbumError && <p className="text-red-500 text-xs mt-1">{newAlbumError}</p>}
                  </div>
              )}
              <label className="flex items-center space-x-3 p-3 border dark:border-gray-700 rounded-lg">
                <input type="radio" name="album-option" checked={selectionMode === 'none'} onChange={() => setSelectionMode('none')} className="h-4 w-4 text-brand-600 border-gray-300 focus:ring-brand-500" />
                <span className="text-sm font-medium">Publicar sem álbum</span>
              </label>
            </div>
          </div>
        </div>

        <div className="flex justify-end items-center p-4 border-t border-gray-200 dark:border-gray-800">
          <button onClick={onClose} className="text-gray-700 dark:text-gray-300 font-semibold px-4 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 mr-4">Cancelar</button>
          <button onClick={handleUpload} disabled={!canUpload} className="bg-brand-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-brand-600 disabled:bg-brand-300 disabled:cursor-not-allowed">
            {isUploading ? 'Publicando...' : `Publicar`}
          </button>
        </div>
      </div>
    </div>
  );
};

export default UploadModal;