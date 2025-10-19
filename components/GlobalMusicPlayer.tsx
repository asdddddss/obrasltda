import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import { GlobalMusicState } from '../types';
import { getGlobalMusicState } from '../services/api';
import { PlayCircleIcon, SpeakerWaveIcon, SpeakerXMarkIcon } from './icons/Icons';

const GlobalMusicPlayer: React.FC = () => {
  const [globalState, setGlobalState] = useState<GlobalMusicState>({
    currentTrack: null,
    isPlaying: false,
  });
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const playerRef = useRef<ReactPlayer>(null);
  
  // State to handle autoplay policy
  const [userInteracted, setUserInteracted] = useState(false);
  const [isReady, setIsReady] = useState(false);
  
  useEffect(() => {
    const fetchState = async () => {
      try {
        const state = await getGlobalMusicState();
        setGlobalState(state);
      } catch (error) {
        console.error("Failed to fetch global music state:", error);
      }
    };
    
    fetchState();
    const interval = setInterval(fetchState, 3000); // Poll every 3 seconds
    
    return () => clearInterval(interval);
  }, []);

  const handleReady = () => {
      setIsReady(true);
  }
  
  const handlePlayInteraction = () => {
    setUserInteracted(true);
    // Try to play immediately on interaction
    if (playerRef.current) {
        playerRef.current.getInternalPlayer()?.play();
    }
  };
  
  const { currentTrack, isPlaying } = globalState;

  // This logic determines if we should try to play
  const shouldPlay = isPlaying && userInteracted && isReady;

  // The player should only render if there's a track set by the DJ
  if (!currentTrack) {
    return null;
  }
  
  // Show a prompt if autoplay is likely blocked
  if (isPlaying && !userInteracted) {
      return (
          <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-50 lg:left-64">
            <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg p-2 max-w-5xl mx-auto flex items-center justify-between space-x-4">
                <div className="flex-grow">
                    <p className="font-semibold text-sm truncate">{currentTrack.title}</p>
                    <p className="text-xs text-gray-500">{currentTrack.artist}</p>
                </div>
                <button onClick={handlePlayInteraction} className="flex items-center space-x-2 text-brand-600 font-bold px-4 py-2 rounded-lg hover:bg-brand-50 dark:hover:bg-brand-900/50">
                    <PlayCircleIcon className="h-6 w-6" />
                    <span>Tocar Música</span>
                </button>
            </div>
          </div>
      )
  }

  return (
    <div className="fixed bottom-16 lg:bottom-0 left-0 right-0 z-50 lg:left-64">
        {/* The actual player is hidden, we just use its audio capabilities */}
        <div className="hidden">
            <ReactPlayer
                ref={playerRef}
                url={currentTrack.url}
                playing={shouldPlay}
                volume={volume}
                muted={isMuted}
                onReady={handleReady}
                width="0"
                height="0"
            />
        </div>
        
        {/* Our custom UI */}
        <div className="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 shadow-lg p-2 max-w-5xl mx-auto flex items-center space-x-4">
             <div className="flex-grow">
                <div className="font-bold text-sm truncate">{currentTrack.title}</div>
                <div className="text-xs text-gray-500 truncate">{currentTrack.artist}</div>
            </div>
            <div className="flex items-center space-x-2">
                <button onClick={() => setIsMuted(!isMuted)}>
                    {isMuted || volume === 0 ? <SpeakerXMarkIcon className="h-6 w-6"/> : <SpeakerWaveIcon className="h-6 w-6"/>}
                </button>
                <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.05}
                    value={volume}
                    onChange={e => {
                        setVolume(parseFloat(e.target.value));
                        if (isMuted) setIsMuted(false);
                    }}
                    className="w-24 h-1 accent-brand-500"
                />
            </div>
        </div>
    </div>
  );
};

export default GlobalMusicPlayer;