import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MediaItem, Story, User, Album, Role } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getMediaForFeed, getStories, getMockUsers, getAllVisibleAlbums } from '../services/api';

// Components
import StoryReel from '../components/StoryReel';
import StoryViewer from '../components/StoryViewer';
import PhotoModal from '../components/PhotoModal';
import SelectionModal from '../components/SelectionModal';
import { FunnelIcon, ChevronDownIcon, ChevronUpIcon } from '../components/icons/Icons';

interface HomePageProps {
  dataVersion: number;
  setEditingMediaItem: (mediaItem: MediaItem | null) => void;
}

const HomePage: React.FC<HomePageProps> = ({ dataVersion, setEditingMediaItem }) => {
  const { user: currentUser } = useAuth();
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]); // For filters
  const [loading, setLoading] = useState(true);
  
  // Story viewer state
  const [viewingUserStories, setViewingUserStories] = useState<User | null>(null);

  // Photo modal state
  const [selectedMediaItem, setSelectedMediaItem] = useState<MediaItem | null>(null);
  
  // Filter state
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [selectedAlbums, setSelectedAlbums] = useState<string[]>([]);

  // Modal state for filters
  const [isPeopleModalOpen, setIsPeopleModalOpen] = useState(false);
  const [isAlbumModalOpen, setIsAlbumModalOpen] = useState(false);


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [mediaData, storiesData, usersData, albumsData] = await Promise.all([
          getMediaForFeed(currentUser),
          getStories(),
          getMockUsers(),
          getAllVisibleAlbums(currentUser) // Fetch albums for filters
        ]);
        setMedia(mediaData);
        setStories(storiesData);
        setUsers(usersData);
        setAlbums(albumsData);
      } catch (error) {
        console.error("Failed to fetch feed data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentUser, dataVersion]);
  
  const filteredMedia = useMemo(() => {
    if (selectedPeople.length === 0 && selectedAlbums.length === 0) {
      return media;
    }

    return media.filter(item => {
      const matchPerson = selectedPeople.length === 0 || selectedPeople.includes(item.uploadedBy) || item.taggedUsers?.some(id => selectedPeople.includes(id));
      const matchAlbum = selectedAlbums.length === 0 || (item.albumId && selectedAlbums.includes(item.albumId));
      
      return matchPerson && matchAlbum;
    });
  }, [media, selectedPeople, selectedAlbums]);

  const clearFilters = () => {
    setSelectedPeople([]);
    setSelectedAlbums([]);
  };

  const storiesByUser = useMemo(() => {
    return stories.reduce((acc, story) => {
      if (!acc[story.userId]) {
        acc[story.userId] = [];
      }
      acc[story.userId].push(story);
      return acc;
    }, {} as { [key: string]: Story[] });
  }, [stories]);
  
  const userMap = useMemo(() => {
      const map = new Map<string, User>();
      users.forEach(u => map.set(u.id, u));
      return map;
  }, [users]);

  const handleStoryClick = (userId: string) => {
    const user = users.find(u => u.id === userId);
    if (user) {
      setViewingUserStories(user);
    }
  };

  const handleMediaClick = (mediaItem: MediaItem) => {
    setSelectedMediaItem(mediaItem);
  };

  const handleModalClose = () => {
    setSelectedMediaItem(null);
  };
  
  const handleEditClick = (mediaItem: MediaItem) => {
    handleModalClose();
    setEditingMediaItem(mediaItem);
  };

  const handleNextMedia = () => {
    const currentIndex = filteredMedia.findIndex(p => p.id === selectedMediaItem?.id);
    if (currentIndex > -1 && currentIndex < filteredMedia.length - 1) {
      setSelectedMediaItem(filteredMedia[currentIndex + 1]);
    }
  };

  const handlePrevMedia = () => {
    const currentIndex = filteredMedia.findIndex(p => p.id === selectedMediaItem?.id);
    if (currentIndex > 0) {
      setSelectedMediaItem(filteredMedia[currentIndex - 1]);
    }
  };


  if (loading) {
    return <p className="text-center py-10">Carregando feed...</p>;
  }
  
  return (
    <div>
      <StoryReel storiesByUser={storiesByUser} users={users} onUserClick={handleStoryClick} />
      
      <div className="my-6">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">Feed de Atividades</h2>
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
          <div className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow-md mb-6">
             <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button 
                  onClick={() => setIsPeopleModalOpen(true)}
                  className="w-full text-left p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <span className="font-semibold">Pessoas</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                    {selectedPeople.length > 0 ? `${selectedPeople.length} selecionada(s)` : 'Todas'}
                  </span>
                </button>
                 <button 
                  onClick={() => setIsAlbumModalOpen(true)}
                  className="w-full text-left p-3 bg-gray-100 dark:bg-gray-800 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-700"
                >
                  <span className="font-semibold">Álbuns</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400 ml-2">
                    {selectedAlbums.length > 0 ? `${selectedAlbums.length} selecionado(s)` : 'Todos'}
                  </span>
                </button>
             </div>
             {(selectedPeople.length > 0 || selectedAlbums.length > 0) && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 text-right">
                    <button
                        onClick={clearFilters}
                        className="text-sm text-brand-500 hover:underline"
                    >
                        Limpar Filtros
                    </button>
                </div>
            )}
          </div>
        )}
      </div>

      <div className="space-y-8">
        {filteredMedia.map(item => {
          const uploader = userMap.get(item.uploadedBy);
          return (
            <div key={item.id} className="bg-white dark:bg-gray-900 rounded-lg shadow-md overflow-hidden">
              <div className="p-4 flex items-center space-x-3">
                {uploader ? (
                    <Link to={`/profile/${uploader.id}`}>
                        <img src={uploader.avatar} alt={uploader.name} className="h-10 w-10 rounded-full" />
                    </Link>
                ) : <div className="h-10 w-10 rounded-full bg-gray-200 dark:bg-gray-700" />}
                <div>
                  <p className="font-semibold">
                    {uploader ? <Link to={`/profile/${uploader.id}`} className="hover:underline">{uploader.name}</Link> : 'Usuário desconhecido'}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{new Date(item.createdAt).toLocaleString()}</p>
                </div>
              </div>

              <div className="cursor-pointer bg-black flex items-center justify-center" onClick={() => handleMediaClick(item)}>
                {item.type === 'image' ? (
                  <img src={item.url} alt={item.description} className={`w-full max-h-[70vh] h-auto object-contain ${item.filter || ''}`} />
                ) : (
                  <video src={item.url} controls className="w-full max-h-[70vh] h-auto" />
                )}
              </div>
              
              <div className="p-4">
                <p>{item.description}</p>
              </div>
            </div>
          )
        })}
        {filteredMedia.length === 0 && (
            <p className="text-center text-gray-500 py-10">
                {media.length === 0 ? "O feed está vazio. Comece adicionando fotos ou vídeos!" : "Nenhum item corresponde aos filtros selecionados."}
            </p>
        )}
      </div>

      {viewingUserStories && (
        <StoryViewer 
          user={viewingUserStories}
          stories={storiesByUser[viewingUserStories.id]}
          onClose={() => setViewingUserStories(null)}
        />
      )}

      {selectedMediaItem && (
        <PhotoModal 
          photo={selectedMediaItem}
          onClose={handleModalClose}
          onNext={filteredMedia.findIndex(p => p.id === selectedMediaItem.id) < filteredMedia.length - 1 ? handleNextMedia : undefined}
          onPrev={filteredMedia.findIndex(p => p.id === selectedMediaItem.id) > 0 ? handlePrevMedia : undefined}
          onEditClick={currentUser?.id === selectedMediaItem.uploadedBy || (currentUser?.role && [Role.ADMIN, Role.ADMIN_MASTER].includes(currentUser.role)) ? () => handleEditClick(selectedMediaItem) : undefined}
        />
      )}

      <SelectionModal
        isOpen={isPeopleModalOpen}
        onClose={() => setIsPeopleModalOpen(false)}
        title="Filtrar por Pessoas"
        items={users.filter(u => u.status === 'APPROVED').map(u => ({ id: u.id, name: u.name, avatar: u.avatar }))}
        selectedIds={selectedPeople}
        onApply={setSelectedPeople}
      />

      <SelectionModal
        isOpen={isAlbumModalOpen}
        onClose={() => setIsAlbumModalOpen(false)}
        title="Filtrar por Álbuns"
        items={albums.map(a => ({ id: a.id, name: a.title }))}
        selectedIds={selectedAlbums}
        onApply={setSelectedAlbums}
      />

    </div>
  );
};

export default HomePage;