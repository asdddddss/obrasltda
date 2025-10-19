import React, { useState, useEffect, useCallback } from 'react';
import { MusicTrack, Role } from '../types';
import { getMusicTracks, addMusicTrack, updateGlobalMusicState, deleteMusicTrack } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import DJPlayer from '../components/DJPlayer';
import { CloudArrowUpIcon, TrashIcon } from '../components/icons/Icons';

const MusicPage: React.FC = () => {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTrack, setSelectedTrack] = useState<MusicTrack | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  
  const fetchTracks = useCallback(async () => {
    setLoading(true);
    try {
      const trackData = await getMusicTracks();
      setTracks(trackData);
    } catch (error) {
      console.error("Failed to fetch music tracks:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTracks();
  }, [fetchTracks]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type === 'audio/mpeg') {
      setIsUploading(true);
      try {
        await addMusicTrack(file);
        await fetchTracks(); // Refresh the list
      } catch (error) {
        console.error("Failed to upload track", error);
        alert("Falha no upload da música.");
      } finally {
        setIsUploading(false);
      }
    } else {
        alert("Por favor, selecione um arquivo .mp3");
    }
     // Reset file input to allow uploading the same file again
    e.target.value = '';
  };
  
  const handleTrackSelect = (track: MusicTrack) => {
    setSelectedTrack(track);
    // Set this track as the global track for everyone to hear
    updateGlobalMusicState({ currentTrack: track, isPlaying: true });
  };
  
  const handleStop = () => {
      setSelectedTrack(null);
      updateGlobalMusicState({ currentTrack: null, isPlaying: false });
  }

  const handleDelete = async (trackId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent track selection when deleting
    if (window.confirm("Tem certeza que deseja apagar esta música?")) {
        await deleteMusicTrack(trackId);
        await fetchTracks();
        if(selectedTrack?.id === trackId) {
            handleStop();
        }
    }
  }

  const isAdmin = user?.role === Role.ADMIN || user?.role === Role.ADMIN_MASTER;

  if (!isAdmin) {
      return (
          <div className="py-8 text-center">
            <h1 className="text-3xl font-bold mb-4">Central de Música</h1>
            <p className="text-gray-500">A música do site está sendo controlada pelo DJ. Ouça no player global!</p>
          </div>
      )
  }

  // DJ Panel View
  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-2">Painel do DJ</h1>
      <p className="text-gray-500 mb-6">Gerencie a playlist e controle o que todos estão ouvindo.</p>

      {selectedTrack ? (
        <DJPlayer key={selectedTrack.id} track={selectedTrack} onStop={handleStop} />
      ) : (
        <div className="p-8 text-center bg-gray-100 dark:bg-gray-800 rounded-lg">
            <p className="font-semibold">Nenhuma música tocando no seu painel.</p>
            <p className="text-sm text-gray-500">Selecione uma música da playlist para começar.</p>
        </div>
      )}

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Biblioteca de Músicas</h2>
        
        <div className="mb-4">
          <label htmlFor="track-upload" className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                  <CloudArrowUpIcon className="w-10 h-10 mb-3 text-gray-400" />
                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Clique para fazer upload</span> ou arraste e solte</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">Apenas arquivos .MP3</p>
              </div>
              <input id="track-upload" type="file" className="sr-only" accept=".mp3,audio/mpeg" onChange={handleFileChange} disabled={isUploading} />
          </label>
          {isUploading && <p className="text-sm text-center mt-2">Enviando música...</p>}
        </div>

        <div className="space-y-2">
          {loading ? (
             <p>Carregando biblioteca...</p>
          ) : tracks.length > 0 ? (
            tracks.map(track => (
              <div
                key={track.id}
                onClick={() => handleTrackSelect(track)}
                className={`p-3 rounded-lg cursor-pointer flex items-center justify-between transition-colors ${selectedTrack?.id === track.id ? 'bg-brand-100 dark:bg-brand-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-800'}`}
              >
                <div>
                  <p className="font-semibold">{track.title}</p>
                  <p className="text-sm text-gray-500">{track.artist}</p>
                </div>
                <button onClick={(e) => handleDelete(track.id, e)} className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 text-gray-500 hover:text-red-600">
                    <TrashIcon className="h-5 w-5" />
                </button>
              </div>
            ))
          ) : (
            <p className="text-center text-gray-500 py-6">Sua biblioteca está vazia. Faça o upload de uma música para começar.</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default MusicPage;