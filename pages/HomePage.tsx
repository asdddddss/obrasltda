import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { MediaItem, Story, User, Album, Role } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { getMediaForFeed, getStories, getMockUsers, getAllVisibleAlbums } from '../services/api';

// Components
import StoryReel from '../components/StoryReel';
import StoryViewer from '../components/StoryViewer';
import PhotoModal from '../components/PhotoModal';
import { FunnelIcon, ChevronDownIcon, ChevronUpIcon } from '../components/icons/Icons';

interface HomePageProps {
  dataVersion: number;
  setEditingMediaItem: (mediaItem: MediaItem | null) => void;
}

interface FilterPillProps {
  label: string;
  isSelected: boolean;
  onClick: () => void;
}

const FilterPill: React.FC<FilterPillProps> = ({ label, isSelected, onClick }) => (
  <button
    onClick={onClick}
    className={`px-3 py-1.5 text-sm font-medium rounded-full border transition-colors duration-200 ${
      isSelected
        ? 'bg-brand-500 border-brand-500 text-white'
        : 'bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-800 dark:text-gray-200'
    }`}
  >
    {label}
  </button>
);


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
  const [openFilterSection, setOpenFilterSection] = useState<'pessoas' | 'albuns' | null>(null);
  const [selectedPeople, setSelectedPeople] = useState<string[]>([]);
  const [selectedAlbums, setSelectedAlbums] = useState<string[]>([]);


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
      const matchPerson = selectedPeople.length > 0 && selectedPeople.includes(item.uploadedBy);
      const matchAlbum = selectedAlbums.length > 0 && item.albumId && selectedAlbums.includes(item.albumId);
      
      if (selectedPeople.length > 0 && selectedAlbums.length > 0) {
        return matchPerson || matchAlbum;
      }
      
      return matchPerson || matchAlbum;
    });
  }, [media, selectedPeople, selectedAlbums]);

  const toggleFilterSection = (section: 'pessoas' | 'albuns') => {
    setOpenFilterSection(prev => (prev === section ? null : section));
  };

  const handlePersonSelect = (userId: string) => {
    setSelectedPeople(prev => 
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };
  
  const handleAlbumSelect = (albumId: string) => {
    setSelectedAlbums(prev =>
      prev.includes(albumId) ? prev.filter(id => id !== albumId) : [...prev, albumId]
    );
  };

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
      
      <div className="my-4 p-4 bg-white dark:bg-gray-900 rounded-lg shadow-md">
        <div className="flex justify-between items-center">
          <button
            onClick={() => setIsFilterOpen(!isFilterOpen)}
            className="flex items-center space-x-2 text-gray-700 dark:text-gray-200 font-semibold"
          >
            <FunnelIcon className="h-5 w-5" />
            <span>Filtros</span>
          </button>
          {(selectedPeople.length > 0 || selectedAlbums.length > 0) && (
              <button
                  onClick={clearFilters}
                  className="text-sm text-brand-500 hover:underline"
              >
                  Limpar Filtros
              </button>
          )}
        </div>

        {isFilterOpen && (
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            {/* Pessoas Accordion */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleFilterSection('pessoas')}
                className="w-full flex justify-between items-center p-3 font-semibold text-left hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
              >
                <span>Pessoas</span>
                {openFilterSection === 'pessoas' ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
              </button>
              {openFilterSection === 'pessoas' && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto scrollbar-hide p-1">
                    {users.filter(u => u.status === 'APPROVED').map(user => (
                      <FilterPill
                          key={user.id}
                          label={user.name}
                          isSelected={selectedPeople.includes(user.id)}
                          onClick={() => handlePersonSelect(user.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Álbuns Accordion */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
              <button
                onClick={() => toggleFilterSection('albuns')}
                className="w-full flex justify-between items-center p-3 font-semibold text-left hover:bg-gray-50 dark:hover:bg-gray-800/60 transition-colors"
              >
                <span>Álbuns</span>
                {openFilterSection === 'albuns' ? <ChevronUpIcon className="h-5 w-5" /> : <ChevronDownIcon className="h-5 w-5" />}
              </button>
              {openFilterSection === 'albuns' && (
                <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <div className="flex flex-wrap gap-2 max-h-48 overflow-y-auto scrollbar-hide p-1">
                    {albums.map(album => (
                      <FilterPill
                          key={album.id}
                          label={album.title}
                          isSelected={selectedAlbums.includes(album.id)}
                          onClick={() => handleAlbumSelect(album.id)}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
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
    </div>
  );
};

export default HomePage;