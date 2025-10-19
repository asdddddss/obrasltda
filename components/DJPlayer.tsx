import React, { useRef, useEffect, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { MusicTrack } from '../types';
import { PlayCircleIcon, PauseCircleIcon, StopCircleIcon } from './icons/Icons';
import { updateGlobalMusicState } from '../services/api';

interface DJPlayerProps {
  track: MusicTrack;
  onStop: () => void;
}

const DJPlayer: React.FC<DJPlayerProps> = ({ track, onStop }) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(true);
  
  // Jog Wheel State
  const jogWheelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const rotationRef = useRef(0);
  const wasPlayingBeforeDrag = useRef(false);

  useEffect(() => {
    if (!waveformRef.current) return;

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: '#A8B5C1',
      progressColor: '#0ea5e9',
      height: 100,
      barWidth: 3,
      barGap: 2,
      barRadius: 2,
      url: track.url,
      
    });

    wavesurfer.current = ws;

    ws.on('ready', () => {
      ws.play();
    });

    ws.on('play', () => {
        setIsPlaying(true);
        updateGlobalMusicState({ isPlaying: true });
    });
    ws.on('pause', () => {
        setIsPlaying(false);
        updateGlobalMusicState({ isPlaying: false });
    });
    ws.on('finish', () => {
        onStop(); // Or implement play next from queue
    });
    
     ws.on('timeupdate', (currentTime) => {
        if (!isDragging) {
            const duration = ws.getDuration();
            rotationRef.current = (currentTime / duration) * 360 * 2; // Rotate twice for a full song
            if (jogWheelRef.current) {
                jogWheelRef.current.style.transform = `rotate(${rotationRef.current}deg)`;
            }
        }
    });

    return () => {
      ws.destroy();
    };
  }, [track, onStop, isDragging]);

  const handleTogglePlay = () => {
    wavesurfer.current?.playPause();
  };
  
  const handleStop = () => {
      onStop();
  }
  
  // --- Jog Wheel Logic ---
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    wasPlayingBeforeDrag.current = wavesurfer.current?.isPlaying() || false;
    if (wasPlayingBeforeDrag.current) {
      wavesurfer.current?.pause();
    }
    setIsDragging(true);
  };

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !wavesurfer.current) return;
    const { movementX } = e;
    const ws = wavesurfer.current;
    const duration = ws.getDuration();
    if(duration > 0) {
        // Seek relative to movement. Adjust sensitivity by changing the divisor.
        ws.seekTo(ws.getCurrentTime() / duration + movementX / 800);
        
        // Update visual rotation
        rotationRef.current += movementX * 0.5;
        if(jogWheelRef.current) {
            jogWheelRef.current.style.transform = `rotate(${rotationRef.current}deg)`;
        }
    }
  }, [isDragging]);

  const handleMouseUp = useCallback(() => {
    if (isDragging) {
      if (wasPlayingBeforeDrag.current) {
        wavesurfer.current?.play();
      }
      setIsDragging(false);
    }
  }, [isDragging]);

  useEffect(() => {
    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    } else {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    }
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);


  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-lg shadow-lg">
      <div className="flex items-center space-x-4 mb-4">
        <div 
            ref={jogWheelRef}
            onMouseDown={handleMouseDown}
            className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing select-none"
        >
            <div className="w-20 h-20 bg-gray-800 dark:bg-black rounded-full border-4 border-gray-400 dark:border-gray-600 relative">
                <div className="absolute top-0 left-1/2 -ml-0.5 h-3 w-1 bg-brand-500 rounded-full"></div>
            </div>
        </div>
        <div className="flex-grow">
            <h3 className="font-bold text-lg">{track.title}</h3>
            <p className="text-sm text-gray-500">{track.artist}</p>
        </div>
      </div>
      <div ref={waveformRef} className="w-full h-[100px] mb-4" />
      <div className="flex items-center justify-center space-x-4">
        <button onClick={handleTogglePlay}>
          {isPlaying ? <PauseCircleIcon className="w-12 h-12 text-brand-500" /> : <PlayCircleIcon className="w-12 h-12 text-brand-500" />}
        </button>
        <button onClick={handleStop}>
            <StopCircleIcon className="w-12 h-12 text-gray-500" />
        </button>
      </div>
    </div>
  );
};

export default DJPlayer;
