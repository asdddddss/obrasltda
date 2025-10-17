import React, { useState, useEffect } from 'react';
import { MediaItem, Album } from '../../types';
import { getAllAlbumsForAdmin, getAllAlbumlessMediaForAdmin } from '../../services/api';
import PhotoGrid from '../PhotoGrid';

interface ContentManagementTabProps {
  setEditingMediaItem: (mediaItem: MediaItem | null) => void;
}

const ContentManagementTab: React.FC<ContentManagementTabProps> = ({ setEditingMediaItem }) => {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [albumlessMedia, setAlbumlessMedia] = useState<MediaItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [adminAlbums, adminAlbumless] = await Promise.all([
        getAllAlbumsForAdmin(),
        getAllAlbumlessMediaForAdmin(),
      ]);
      setAlbums(adminAlbums);
      setAlbumlessMedia(adminAlbumless);
      setLoading(false);
    };

    fetchData();
  }, []);

  const handlePhotoClick = (photo: MediaItem) => {
    if (photo.type === 'image') {
      setEditingMediaItem(photo);
    } else {
      // Maybe open a video viewer/editor in the future
      alert("A edição de vídeos não é suportada no momento.");
    }
  };

  if (loading) {
    return <p className="text-center py-10">Carregando todo o conteúdo...</p>;
  }

  return (
    <div className="space-y-12">
      {albums.map((album) => (
        <section key={album.id}>
          <div className="pb-4 border-b border-gray-200 dark:border-gray-700 mb-4">
            <h2 className="text-xl font-bold">{album.title}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{album.photos.length} item(ns)</p>
          </div>
          <PhotoGrid photos={album.photos} onPhotoClick={handlePhotoClick} />
        </section>
      ))}

      {albumlessMedia.length > 0 && (
        <section>
           <div className="pb-4 border-b border-gray-200 dark:border-gray-700 mb-4">
            <h2 className="text-xl font-bold">Fotos Sem Álbum</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">{albumlessMedia.length} item(ns)</p>
          </div>
          <PhotoGrid photos={albumlessMedia} onPhotoClick={handlePhotoClick} />
        </section>
      )}
    </div>
  );
};

export default ContentManagementTab;