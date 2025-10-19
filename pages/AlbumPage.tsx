import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Album, MediaItem, User, Role } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getAlbumById, getUser, deleteMediaItem, getMockUsers } from '../services/api';
import PhotoGrid from '../components/PhotoGrid';
import PhotoModal from '../components/PhotoModal';
import SelectionModal from '../components/SelectionModal';
import { PencilSquareIcon, TrashIcon, FunnelIcon, ChevronUpIcon, ChevronDownIcon } from '../components/icons/Icons';

interface AlbumPageProps {
  setEditingMediaItem: (mediaItem: MediaItem | null) => void;
}

const AlbumPage: React.FC<AlbumPageProps> = ({ setEditingMediaItem }) => {
  const { albumId } = useParams<{ albumId: string }>();
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  
  const [album, setAlbum] = useState<Album | null>(null);
  const [author, setAuthor] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [selectedMediaItem, setSelectedMediaItem] = useState<MediaItem | null>(null);

  // Filter state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [isPeopleModalOpen, setIsPeopleModalOpen] = useState(false);
  const [filterableUsers, setFilterableUsers] = useState<User[]>([]);

  const fetchAlbumData = useCallback(async () => {
    if (!albumId) {
        setError('ID do álbum não fornecido.');
        setLoading(false);
        return;
    }
    setLoading(true);
    setError('');
    try {
        const albumData = await getAlbumById(albumId, currentUser);
        if (albumData) {
            setAlbum(albumData);
            const authorData = await getUser(albumData.createdBy);
            if (authorData) setAuthor(authorData);

            const taggedUserIds = new Set<string>();
            albumData.photos.forEach(p => {
                p.taggedUsers?.forEach(id => taggedUserIds.add(id));
            });
            const allUsers = await getMockUsers();
            const usersInAlbum = allUsers.filter(u => taggedUserIds.has(u.id));
            setFilterableUsers(usersInAlbum);

        } else {
            setError('Álbum não encontrado ou você não tem permissão para vê-lo.');
        }
    } catch (err) {
        setError('Falha ao carregar o álbum.');
        console.error(err);
    } finally {
        setLoading(false);
    }
  }, [albumId, currentUser]);
  
  useEffect(() => {
    fetchAlbumData();
  }, [fetchAlbumData]);

  const filteredPhotos = useMemo(() => {
    if (!album) return [];
    if (selectedPeople.length === 0) return album.photos;
    
    return album.photos.filter(photo => 
        photo.taggedUsers?.some(userId => selectedPeople.includes(userId))
    );
  }, [album, selectedPeople]);

  const handleMediaClick = (mediaItem: MediaItem) => {
    setSelectedMediaItem(mediaItem);
  };
  
  const handleModalClose = () => {
    setSelectedMediaItem(null);
  };

  const handleNextMedia = () => {
    if (!album || !selectedMediaItem) return;
    const currentIndex = filteredPhotos.findIndex(p => p.id === selectedMediaItem.id);
    if (currentIndex > -1 && currentIndex < filteredPhotos.length - 1) {
      setSelectedMediaItem(filteredPhotos[currentIndex + 1]);
    }
  };

  const handlePrevMedia = () => {
    if (!album || !selectedMediaItem) return;
    const currentIndex = filteredPhotos.findIndex(p => p.id === selectedMediaItem.id);
    if (currentIndex > 0) {
      setSelectedMediaItem(filteredPhotos[currentIndex - 1]);
    }
  };
  
  const handleEditClick = (mediaItem: MediaItem) => {
    handleModalClose();
    setEditingMediaItem(mediaItem);
  };
  
  const handleDeleteClick = async (mediaItem: MediaItem) => {
    if (window.confirm('Tem certeza que deseja apagar esta mídia?')) {
        await deleteMediaItem(mediaItem.id, mediaItem.albumId);
        handleModalClose();
        fetchAlbumData(); 
    }
  };

  if (loading) return <p className="text-center py-10">Carregando álbum...</p>;
  if (error) return <p className="text-center py-10 text-red-500">{error}</p>;
  if (!album) return <p className="text-center py-10">Álbum não encontrado.</p>;

  const canEdit = currentUser?.id === album.createdBy || (currentUser?.role && [Role.ADMIN, Role.ADMIN_MASTER].includes(currentUser.role));

  return (
    <div className="py-8">
        <div className="mb-8">
            <h1 className="text-4xl font-bold">{album.title}</h1>
            <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-2xl">{album.description}</p>
            {author && (
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                    Criado por <Link to={`/profile/${author.id}`} className="font-semibold hover:underline">{author.name}</Link> em {new Date(album.createdAt).toLocaleDateString()}
                </p>
            )}
        </div>
      
        <div className="flex justify-end items-center mb-6">
            <button
                onClick={() => setIsFilterOpen(!isFilterOpen)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-100 dark:bg-gray-800 rounded-lg text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition"
            >
                <FunnelIcon className="h-4 w-4" />
                <span>Filtros</span>
                {isFilterOpen ? <ChevronUpIcon className="h-4 w-4" /> : <ChevronDownIcon className="h-4 w-4" />}
            </button>
        </div>
        {isFilterOpen && (
            <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow-md mb-6 max-w-sm ml-auto">
                <button 
                    onClick={() => setIsPeopleModalOpen(true)}
                    disabled={filterableUsers.length === 0}
                    className="w-full text-left p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <span className="font-semibold">Pessoas</span>
                    <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                        {selectedPeople.length > 0 ? `${selectedPeople.length} selecionada(s)` : 'Todas'}
                    </span>
                </button>
                {filterableUsers.length === 0 && <p className="text-xs text-gray-500 mt-1">Ninguém foi marcado neste álbum.</p>}
                {selectedPeople.length > 0 && (
                    <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-right">
                        <button
                            onClick={() => setSelectedPeople([])}
                            className="text-sm text-brand-500 hover:underline"
                        >
                            Limpar Filtro
                        </button>
                    </div>
                )}
            </div>
        )}

        <PhotoGrid photos={filteredPhotos} onPhotoClick={handleMediaClick} />

        {selectedMediaItem && (
            <PhotoModal 
                photo={selectedMediaItem}
                onClose={handleModalClose}
                onNext={filteredPhotos.findIndex(p => p.id === selectedMediaItem.id) < filteredPhotos.length - 1 ? handleNextMedia : undefined}
                onPrev={filteredPhotos.findIndex(p => p.id === selectedMediaItem.id) > 0 ? handlePrevMedia : undefined}
                onEditClick={canEdit ? () => handleEditClick(selectedMediaItem) : undefined}
            />
        )}

        <SelectionModal
            isOpen={isPeopleModalOpen}
            onClose={() => setIsPeopleModalOpen(false)}
            title="Filtrar por Pessoas no Álbum"
            items={filterableUsers.map(u => ({ id: u.id, name: u.name, avatar: u.avatar }))}
            selectedIds={selectedPeople}
            onApply={setSelectedPeople}
        />
    </div>
  );
};

export default AlbumPage;