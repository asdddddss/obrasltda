import React, { useState, useEffect, useCallback, useRef } from 'react';
import { MusicTrack, Role, MixerControls } from '../types';
import { getMusicTracks, addMusicTrack, deleteMusicTrack } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import DJPlayer from '../components/DJPlayer';
import Mixer from '../components/Mixer';
import { CloudArrowUpIcon, TrashIcon } from '../components/icons/Icons';

const initialMixerControls: MixerControls = {
  low: 0,
  mid: 0,
  high: 0,
  filter: 0,
  volume: 1,
};

const MusicPage: React.FC = () => {
  const [tracks, setTracks] = useState<MusicTrack[]>([]);
  const [loading, setLoading] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const { user } = useAuth();
  
  // DJ Deck State
  const [trackA, setTrackA] = useState<MusicTrack | null>(null);
  const [trackB, setTrackB] = useState<MusicTrack | null>(null);
  const [bpmA, setBpmA] = useState<number | null>(null);
  const [bpmB, setBpmB] = useState<number | null>(null);

  // Mixer State
  const [controlsA, setControlsA] = useState<MixerControls>(initialMixerControls);
  const [controlsB, setControlsB] = useState<MixerControls>(initialMixerControls);
  const [vuLevelA, setVuLevelA] = useState(0);
  const [vuLevelB, setVuLevelB] = useState(0);
  const [crossfader, setCrossfader] = useState(0);

  // Web Audio API refs
  const audioContextRef = useRef<AudioContext | null>(null);
  const channelAGainRef = useRef<GainNode | null>(null);
  const channelBGainRef = useRef<GainNode | null>(null);
  const crossfaderAGainRef = useRef<GainNode | null>(null);
  const crossfaderBGainRef = useRef<GainNode | null>(null);

  useEffect(() => {
    if (!audioContextRef.current) {
        const context = new (window.AudioContext || (window as any).webkitAudioContext)();
        audioContextRef.current = context;

        // Channel Fader Nodes
        const gainA = context.createGain();
        channelAGainRef.current = gainA;
        const gainB = context.createGain();
        channelBGainRef.current = gainB;

        // Crossfader Nodes
        const cfGainA = context.createGain();
        crossfaderAGainRef.current = cfGainA;
        const cfGainB = context.createGain();
        crossfaderBGainRef.current = cfGainB;

        // Routing
        gainA.connect(cfGainA).connect(context.destination);
        gainB.connect(cfGainB).connect(context.destination);
    }
  }, []);

  useEffect(() => {
    // Channel Fader logic
    if (channelAGainRef.current) channelAGainRef.current.gain.value = controlsA.volume;
    if (channelBGainRef.current) channelBGainRef.current.gain.value = controlsB.volume;
  }, [controlsA.volume, controlsB.volume]);

  useEffect(() => {
    // Crossfader logic (Equal-power crossfade)
    if (crossfaderAGainRef.current && crossfaderBGainRef.current) {
      const value = (crossfader + 1) / 2; // Map from [-1, 1] to [0, 1]
      crossfaderAGainRef.current.gain.value = Math.cos(value * 0.5 * Math.PI);
      crossfaderBGainRef.current.gain.value = Math.cos((1 - value) * 0.5 * Math.PI);
    }
  }, [crossfader]);

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
    if (file && (file.type === 'audio/mpeg' || file.type === 'audio/mp3')) {
      setIsUploading(true);
      try {
        await addMusicTrack(file);
        await fetchTracks();
      } catch (error) {
        console.error("Failed to upload track", error);
        alert("Falha no upload da música.");
      } finally {
        setIsUploading(false);
      }
    } else {
        alert("Por favor, selecione um arquivo .mp3");
    }
    e.target.value = '';
  };
  
  const loadTrack = (track: MusicTrack, deck: 'A' | 'B') => {
    const trackWithCues = { ...track, hotcues: track.hotcues || [] };
    if (deck === 'A') {
      setTrackA(trackWithCues);
      setBpmA(null);
      setControlsA(initialMixerControls);
    } else {
      setTrackB(trackWithCues);
      setBpmB(null);
      setControlsB(initialMixerControls);
    }
  };

  const handleDelete = async (trackId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (window.confirm("Tem certeza que deseja apagar esta música?")) {
        await deleteMusicTrack(trackId);
        await fetchTracks();
        if(trackA?.id === trackId) setTrackA(null);
        if(trackB?.id === trackId) setTrackB(null);
    }
  }

  const isAdmin = user?.role === Role.ADMIN || user?.role === Role.ADMIN_MASTER;

  if (!isAdmin) {
      return (
          <div className="py-8 text-center">
            <h1 className="text-3xl font-bold mb-4">Central de Música</h1>
            <p className="text-gray-500">Acesso restrito ao DJ.</p>
          </div>
      )
  }

  return (
    <div className="py-8">
      <h1 className="text-3xl font-bold mb-2">Painel do DJ</h1>
      <p className="text-gray-500 mb-6">Controle os dois decks e mixe as músicas para todos.</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] gap-4 items-start">
        {/* Deck A */}
        {audioContextRef.current && channelAGainRef.current ? (
          <DJPlayer 
            track={trackA} 
            onStop={() => setTrackA(null)} 
            deckId="A" 
            audioContext={audioContextRef.current} 
            destinationNode={channelAGainRef.current} 
            onBpmDetected={setBpmA} 
            targetBpm={bpmB}
            mixerControls={controlsA}
            onVuLevelUpdate={setVuLevelA}
          />
        ) : (
          <div className="p-8 text-center bg-gray-100 dark:bg-gray-800 rounded-lg h-full flex flex-col justify-center min-h-[400px]">
            <p className="font-bold text-lg">DECK A</p>
            <p className="text-sm text-gray-500">Carregue uma música da biblioteca.</p>
          </div>
        )}

        {/* Mixer */}
        <Mixer
          controlsA={controlsA}
          controlsB={controlsB}
          vuLevelA={vuLevelA}
          vuLevelB={vuLevelB}
          crossfader={crossfader}
          onControlsAChange={(updates) => setControlsA(c => ({...c, ...updates}))}
          onControlsBChange={(updates) => setControlsB(c => ({...c, ...updates}))}
          onCrossfaderChange={setCrossfader}
        />

        {/* Deck B */}
        {audioContextRef.current && channelBGainRef.current ? (
          <DJPlayer 
            track={trackB} 
            onStop={() => setTrackB(null)} 
            deckId="B" 
            audioContext={audioContextRef.current} 
            destinationNode={channelBGainRef.current} 
            onBpmDetected={setBpmB} 
            targetBpm={bpmA}
            mixerControls={controlsB}
            onVuLevelUpdate={setVuLevelB}
          />
        ) : (
          <div className="p-8 text-center bg-gray-100 dark:bg-gray-800 rounded-lg h-full flex flex-col justify-center min-h-[400px]">
            <p className="font-bold text-lg">DECK B</p>
            <p className="text-sm text-gray-500">Carregue uma música da biblioteca.</p>
          </div>
        )}
      </div>

      <div className="mt-8">
        <h2 className="text-2xl font-bold mb-4">Biblioteca de Músicas</h2>
        <label htmlFor="track-upload" className="relative flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-bray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-600 mb-4">
            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <CloudArrowUpIcon className="w-10 h-10 mb-3 text-gray-400" />
                <p className="mb-2 text-sm text-gray-500 dark:text-gray-400"><span className="font-semibold">Clique para fazer upload</span> ou arraste e solte</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">Apenas arquivos .MP3</p>
            </div>
            <input id="track-upload" type="file" className="sr-only" accept=".mp3,audio/mpeg" onChange={handleFileChange} disabled={isUploading} />
        </label>
        {isUploading && <p className="text-sm text-center mt-2">Enviando música...</p>}

        <div className="space-y-2">
          {loading ? (<p>Carregando biblioteca...</p>) 
            : tracks.length > 0 ? (
            tracks.map(track => (
              <div key={track.id} className="p-3 rounded-lg flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
                <div>
                  <p className="font-semibold">{track.title}</p>
                  <p className="text-sm text-gray-500">{track.artist}</p>
                </div>
                <div className="flex items-center gap-x-2">
                    <button onClick={() => loadTrack(track, 'A')} className="w-10 h-10 font-bold bg-blue-500 text-white rounded hover:bg-blue-600">A</button>
                    <button onClick={() => loadTrack(track, 'B')} className="w-10 h-10 font-bold bg-red-500 text-white rounded hover:bg-red-600">B</button>
                    <button onClick={(e) => handleDelete(track.id, e)} className="p-2 rounded-full hover:bg-red-100 dark:hover:bg-red-900/50 text-gray-500 hover:text-red-600">
                        <TrashIcon className="h-5 w-5" />
                    </button>
                </div>
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