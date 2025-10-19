import React, { useRef, useEffect, useState, useCallback } from 'react';
import WaveSurfer from 'wavesurfer.js';
import { MusicTrack, MixerControls } from '../types';
import { PlayCircleIcon, PauseCircleIcon, StopCircleIcon } from './icons/Icons';
import { detectBPM } from '../utils/bpm-detective';

interface DJPlayerProps {
  track: MusicTrack | null;
  onStop: () => void;
  deckId: 'A' | 'B';
  audioContext: AudioContext;
  destinationNode: AudioNode;
  onBpmDetected: (bpm: number | null) => void;
  targetBpm: number | null;
  mixerControls: MixerControls;
  onVuLevelUpdate: (level: number) => void;
}

// Helper function to create a synthetic reverb impulse response
async function createImpulseResponse(audioContext: AudioContext): Promise<AudioBuffer> {
    const sampleRate = audioContext.sampleRate;
    const duration = 2; // 2 seconds reverb
    const decay = 5;
    const length = sampleRate * duration;
    const impulse = audioContext.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
        const n = length - i;
        left[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay);
        right[i] = (Math.random() * 2 - 1) * Math.pow(n / length, decay);
    }
    return impulse;
}


const DJPlayer: React.FC<DJPlayerProps> = ({ 
    track, onStop, deckId, audioContext, destinationNode, onBpmDetected, 
    targetBpm, mixerControls, onVuLevelUpdate
}) => {
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurfer = useRef<WaveSurfer | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [masterTempo, setMasterTempo] = useState(false);
  
  const [reverb, setReverb] = useState(0);
  const [delay, setDelay] = useState(0);
  const [cuePoint, setCuePoint] = useState(0);

  const [loopStart, setLoopStart] = useState<number | null>(null);
  const [loopEnd, setLoopEnd] = useState<number | null>(null);
  const [isLooping, setIsLooping] = useState(false);

  const [originalBpm, setOriginalBpm] = useState<number | null>(null);
  const [isSyncEngaged, setIsSyncEngaged] = useState(false);
  const [isQuantized, setIsQuantized] = useState(false);
  const beatsRef = useRef<number[]>([]);
  const beatInterval = originalBpm ? 60 / originalBpm : null;
  const [beatIndicator, setBeatIndicator] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  
  const [hotcues, setHotcues] = useState<{ id: number; time: number }[]>([]);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  
  const audioGraphInitialized = useRef(false);
  const lowFilterRef = useRef<BiquadFilterNode | null>(null);
  const midFilterRef = useRef<BiquadFilterNode | null>(null);
  const highFilterRef = useRef<BiquadFilterNode | null>(null);
  const hplpFilterRef = useRef<BiquadFilterNode | null>(null);
  const convolverRef = useRef<ConvolverNode | null>(null);
  const dryGainRef = useRef<GainNode | null>(null);
  const wetGainReverbRef = useRef<GainNode | null>(null);
  const delayNodeRef = useRef<DelayNode | null>(null);
  const delayFeedbackRef = useRef<GainNode | null>(null);
  const wetGainDelayRef = useRef<GainNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  
  const abortControllerRef = useRef<AbortController | null>(null);

  const jogWheelRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const rotationRef = useRef(0);
  const wasPlayingBeforeDrag = useRef(false);
  
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => { if (e.key === 'Shift') setIsShiftPressed(true); };
    const handleKeyUp = (e: KeyboardEvent) => { if (e.key === 'Shift') setIsShiftPressed(false); };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
        window.removeEventListener('keydown', handleKeyDown);
        window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  useEffect(() => {
    if (!waveformRef.current) return;

    const ws = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: deckId === 'A' ? '#3b82f6' : '#ef4444',
      progressColor: deckId === 'A' ? '#60a5fa' : '#f87171',
      height: 60, barWidth: 2, barGap: 1, barRadius: 2, mediaControls: false,
    });
    wavesurfer.current = ws;

    ws.on('ready', async (duration) => {
        setIsLoading(false);
        const decodedData = ws.getDecodedData();
        if(decodedData) {
            try {
                const detected = await detectBPM(decodedData);
                setOriginalBpm(detected);
                onBpmDetected(detected);
                const interval = 60 / detected;
                const beatCount = Math.floor(duration / interval);
                beatsRef.current = Array.from({ length: beatCount }, (_, i) => i * interval);
            } catch (err) { 
                console.error("BPM detection failed:", err);
                onBpmDetected(null);
             }
        }
        ws.play();
    });

    ws.on('error', (err) => { console.error(`WaveSurfer error on Deck ${deckId}:`, err); setIsLoading(false); });
    ws.on('play', () => setIsPlaying(true));
    ws.on('pause', () => setIsPlaying(false));
    ws.on('finish', () => { onStop(); });
    ws.on('timeupdate', (currentTime) => {
      if(isLooping && loopStart !== null && loopEnd !== null && currentTime >= loopEnd) { ws.setTime(loopStart); }
      if (!isDragging) {
          const duration = ws.getDuration();
          if (duration > 0) {
            rotationRef.current = (currentTime / duration) * 360 * 2;
            if (jogWheelRef.current) { jogWheelRef.current.style.transform = `rotate(${rotationRef.current}deg)`; }
          }
      }
      if (beatInterval) {
        const beatIndex = Math.floor(currentTime / beatInterval);
        const timeSinceLastBeat = currentTime - (beatIndex * beatInterval);
        if (timeSinceLastBeat < 0.1) {
            setBeatIndicator(true);
            setTimeout(() => setBeatIndicator(false), 100);
        }
      }
    });

    let animationFrameId: number;
    const updateVuMeter = () => {
      if (analyserRef.current) {
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteTimeDomainData(dataArray);
        let sumSquares = 0.0;
        for (const amplitude of dataArray) { const a = (amplitude / 128.0) - 1.0; sumSquares += a * a; }
        const rms = Math.sqrt(sumSquares / dataArray.length);
        onVuLevelUpdate(rms);
      }
      animationFrameId = requestAnimationFrame(updateVuMeter);
    };
    updateVuMeter();

    return () => { cancelAnimationFrame(animationFrameId); ws.destroy(); };
  }, [deckId, onStop, onBpmDetected, beatInterval, onVuLevelUpdate]);


  useEffect(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    if (!track) {
      wavesurfer.current?.empty();
      setIsPlaying(false);
      setOriginalBpm(null);
      onBpmDetected(null);
      return;
    }

    const controller = new AbortController();
    abortControllerRef.current = controller;
    const { signal } = controller;

    const loadNewTrack = async () => {
      if (!wavesurfer.current) return;

      setIsLoading(true);
      setIsPlaying(false);
      setOriginalBpm(null);
      onBpmDetected(null);
      setHotcues(track.hotcues || []);
      setLoopStart(null);
      setLoopEnd(null);
      setIsLooping(false);
      setCuePoint(0);
      setPlaybackRate(1);
      setIsSyncEngaged(false);
      
      try {
        const response = await fetch(track.url, { signal });
        if (!response.ok) throw new Error(`Fetch failed: ${response.statusText}`);
        const blob = await response.blob();
        const objectUrl = URL.createObjectURL(blob);

        if (signal.aborted) {
          URL.revokeObjectURL(objectUrl);
          return;
        }
        
        if (!audioGraphInitialized.current && wavesurfer.current) {
            const mediaElement = wavesurfer.current.getMediaElement();
            if(!mediaElement) throw new Error("Could not get MediaElement.");
            const source = audioContext.createMediaElementSource(mediaElement);
            const analyser = audioContext.createAnalyser();
            analyserRef.current = analyser;

            const lowFilter = audioContext.createBiquadFilter();
            const midFilter = audioContext.createBiquadFilter();
            const highFilter = audioContext.createBiquadFilter();
            const hplpFilterNode = audioContext.createBiquadFilter();
            const dryGain = audioContext.createGain();
            const wetGainReverb = audioContext.createGain();
            const wetGainDelay = audioContext.createGain();
            const convolver = audioContext.createConvolver();
            const delayNode = audioContext.createDelay(5.0);
            const delayFeedback = audioContext.createGain();
            
            lowFilterRef.current = lowFilter; midFilterRef.current = midFilter; highFilterRef.current = highFilter;
            hplpFilterRef.current = hplpFilterNode; dryGainRef.current = dryGain; wetGainReverbRef.current = wetGainReverb;
            convolverRef.current = convolver; delayNodeRef.current = delayNode; delayFeedbackRef.current = delayFeedback;
            wetGainDelayRef.current = wetGainDelay;

            lowFilter.type = 'lowshelf'; lowFilter.frequency.value = 320;
            midFilter.type = 'peaking'; midFilter.frequency.value = 1000; midFilter.Q.value = 0.5;
            highFilter.type = 'highshelf'; highFilter.frequency.value = 3200;
            hplpFilterNode.type = 'lowpass'; hplpFilterNode.frequency.value = audioContext.sampleRate / 2; hplpFilterNode.Q.value = 1;
            dryGain.gain.value = 1; wetGainReverb.gain.value = 0; wetGainDelay.gain.value = 0;
            delayNode.delayTime.value = 0.5; delayFeedback.gain.value = 0;
            convolver.buffer = await createImpulseResponse(audioContext);

            source.connect(analyser).connect(lowFilter).connect(midFilter).connect(highFilter).connect(hplpFilterNode);
            
            hplpFilterNode.connect(dryGain);
            hplpFilterNode.connect(convolver).connect(wetGainReverb);
            hplpFilterNode.connect(delayNode);
            delayNode.connect(delayFeedback).connect(delayNode);
            delayNode.connect(wetGainDelay);

            dryGain.connect(destinationNode);
            wetGainReverb.connect(destinationNode);
            wetGainDelay.connect(destinationNode);

            audioGraphInitialized.current = true;
        }

        await wavesurfer.current.load(objectUrl);
        URL.revokeObjectURL(objectUrl);

      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error(`Error loading track on Deck ${deckId}:`, error);
          setIsLoading(false);
        }
      }
    };

    loadNewTrack();

  }, [track, audioContext, destinationNode]);

  useEffect(() => {
    if(isSyncEngaged && targetBpm && originalBpm) { setPlaybackRate(targetBpm / originalBpm); }
  }, [isSyncEngaged, targetBpm, originalBpm]);

  useEffect(() => { if (lowFilterRef.current) lowFilterRef.current.gain.value = mixerControls.low; }, [mixerControls.low]);
  useEffect(() => { if (midFilterRef.current) midFilterRef.current.gain.value = mixerControls.mid; }, [mixerControls.mid]);
  useEffect(() => { if (highFilterRef.current) highFilterRef.current.gain.value = mixerControls.high; }, [mixerControls.high]);
  
  useEffect(() => {
    if (dryGainRef.current) dryGainRef.current.gain.value = 1;
    if (wetGainReverbRef.current) wetGainReverbRef.current.gain.value = reverb;
    if (delayFeedbackRef.current) delayFeedbackRef.current.gain.value = delay;
    if (wetGainDelayRef.current) wetGainDelayRef.current.gain.value = delay;
  }, [reverb, delay]);

  useEffect(() => {
    if (!hplpFilterRef.current?.context) return;
    const { current: filter } = hplpFilterRef; const { context } = filter;
    const maxFreq = context.sampleRate / 2; const minFreq = 40;
    if (mixerControls.filter === 0) { filter.frequency.value = maxFreq; filter.Q.value = 1; }
    else if (mixerControls.filter < 0) { filter.type = 'lowpass'; const freq = Math.exp((1 + mixerControls.filter) * Math.log(maxFreq / minFreq)) * minFreq; filter.frequency.value = freq; filter.Q.value = 1 + Math.abs(mixerControls.filter) * 4; }
    else { filter.type = 'highpass'; const freq = Math.exp(mixerControls.filter * Math.log(maxFreq / minFreq)) * minFreq; filter.frequency.value = freq; filter.Q.value = 1 + mixerControls.filter * 4; }
  }, [mixerControls.filter]);

  const snapToBeat = (time: number) => {
    if (!isQuantized || beatsRef.current.length === 0) return time;
    const closestBeat = beatsRef.current.reduce((prev, curr) => (Math.abs(curr - time) < Math.abs(prev - time) ? curr : prev));
    return closestBeat;
  };
  
  const handleTogglePlay = () => { wavesurfer.current?.playPause(); };
  
  const handleRateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setIsSyncEngaged(false);
    const newRate = parseFloat(e.target.value);
    setPlaybackRate(newRate);
  };
  const resetRate = () => { setIsSyncEngaged(false); setPlaybackRate(1); };
  
  useEffect(() => { wavesurfer.current?.setPlaybackRate(playbackRate, masterTempo); }, [playbackRate, masterTempo]);
  
  const handleSetCue = () => { if(wavesurfer.current) setCuePoint(snapToBeat(wavesurfer.current.getCurrentTime())); };
  const handleGoToCue = () => { if(wavesurfer.current) { wavesurfer.current.setTime(cuePoint); wavesurfer.current.pause(); } }

  const handleLoopIn = () => { setLoopStart(snapToBeat(wavesurfer.current?.getCurrentTime() ?? 0)); setLoopEnd(null); setIsLooping(false); };
  const handleLoopOut = () => { if (loopStart !== null) { setLoopEnd(snapToBeat(wavesurfer.current?.getCurrentTime() ?? 0)); setIsLooping(true); } };
  const handleExitLoop = () => { setIsLooping(false); setLoopStart(null); setLoopEnd(null); };

  const handleBeatJump = (beats: number) => {
    if(!wavesurfer.current || !beatInterval) return;
    const currentTime = wavesurfer.current.getCurrentTime();
    wavesurfer.current.setTime(currentTime + beats * beatInterval);
  };
  
  const handleHotCueClick = (padId: number) => {
    if(!wavesurfer.current) return;
    const existingCue = hotcues.find(cue => cue.id === padId);
    if (isShiftPressed && existingCue) {
        setHotcues(currentCues => currentCues.filter(cue => cue.id !== padId));
    } else if (existingCue) {
        wavesurfer.current.setTime(existingCue.time);
        wavesurfer.current.play();
    } else {
        const newTime = snapToBeat(wavesurfer.current.getCurrentTime());
        const newCues = [...hotcues.filter(c => c.id !== padId), { id: padId, time: newTime }].sort((a,b) => a.id - b.id);
        setHotcues(newCues);
        if (track) track.hotcues = newCues;
    }
  };

  const handleMouseDown = (e: React.MouseEvent) => { e.preventDefault(); wasPlayingBeforeDrag.current = wavesurfer.current?.isPlaying() || false; if (wasPlayingBeforeDrag.current) { wavesurfer.current?.pause(); } setIsDragging(true); document.body.style.cursor = 'grabbing'; };
  const handleMouseMove = useCallback((e: MouseEvent) => { if (!isDragging || !wavesurfer.current) return; const { movementX } = e; const ws = wavesurfer.current; const duration = ws.getDuration(); if(duration > 0) { ws.setTime(ws.getCurrentTime() + movementX * 0.01); rotationRef.current += movementX * 0.5; if(jogWheelRef.current) { jogWheelRef.current.style.transform = `rotate(${rotationRef.current}deg)`; } } }, [isDragging]);
  const handleMouseUp = useCallback(() => { if (isDragging) { if (wasPlayingBeforeDrag.current) { wavesurfer.current?.play(); } setIsDragging(false); document.body.style.cursor = 'default'; } }, [isDragging]);
  useEffect(() => { if (isDragging) { window.addEventListener('mousemove', handleMouseMove); window.addEventListener('mouseup', handleMouseUp); } else { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); } return () => { window.removeEventListener('mousemove', handleMouseMove); window.removeEventListener('mouseup', handleMouseUp); }; }, [isDragging, handleMouseMove, handleMouseUp]);

  if (!track) {
    return (
        <div className="p-8 text-center bg-gray-100 dark:bg-gray-800 rounded-lg h-full flex flex-col justify-center min-h-[400px]">
            <p className="font-bold text-lg">DECK {deckId}</p>
            <p className="text-sm text-gray-500">Carregue uma música da biblioteca.</p>
        </div>
    );
  }

  return (
    <div className="bg-gray-800 dark:bg-black text-white p-4 rounded-lg shadow-lg border border-gray-700 space-y-2">
      <div className="flex justify-between items-center">
        <span className={`font-bold text-lg ${deckId === 'A' ? 'text-blue-400' : 'text-red-400'}`}>DECK {deckId}</span>
        <div className="text-right">
          <h3 className="font-bold truncate text-base">{track.title}</h3>
          <p className="text-xs text-gray-400">{track.artist}</p>
        </div>
      </div>
      
        <div className="flex-grow flex flex-col items-center gap-y-2">
            <div className="flex justify-between items-center w-full px-2">
              <div className="flex items-center gap-x-2">
                  <span className="text-sm font-mono">BPM: {originalBpm ? (originalBpm * playbackRate).toFixed(1) : '...'}</span>
                  <div className={`w-3 h-3 rounded-full transition-colors ${beatIndicator ? (deckId === 'A' ? 'bg-blue-500' : 'bg-red-500') : 'bg-gray-600'}`}></div>
              </div>
              <div className="flex items-center gap-x-2">
                 <button onClick={() => setIsQuantized(!isQuantized)} className={`px-4 py-1 text-xs font-bold rounded ${isQuantized ? 'bg-purple-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>Q</button>
                 <button onClick={() => setIsSyncEngaged(!isSyncEngaged)} className={`px-4 py-1 text-xs font-bold rounded ${isSyncEngaged ? 'bg-brand-500 text-white' : 'bg-gray-700 hover:bg-gray-600'}`}>SYNC</button>
              </div>
            </div>
            <div ref={waveformRef} className="w-full h-[60px] my-1 bg-gray-700 rounded flex items-center justify-center">
              {isLoading && <span className="text-xs text-gray-400">Loading track...</span>}
            </div>
            <div className="w-full grid grid-cols-4 gap-2">
                {[-4, -1, 1, 4].map(val => (
                    <button key={val} onClick={() => handleBeatJump(val)} className="py-1 text-xs font-bold bg-gray-700 hover:bg-gray-600 rounded">
                        {val > 0 ? `+${val}`: val}
                    </button>
                ))}
            </div>
            <div 
                ref={jogWheelRef}
                onMouseDown={handleMouseDown}
                className="w-32 h-32 md:w-40 md:h-40 bg-gray-700 rounded-full flex items-center justify-center cursor-grab active:cursor-grabbing select-none shadow-lg my-2"
            >
                <div className={`w-28 h-28 md:w-36 md:h-36 bg-black rounded-full border-4 ${deckId === 'A' ? 'border-blue-600' : 'border-red-600'} relative`}>
                    <div className={`absolute top-1 left-1/2 -ml-0.5 h-4 w-1 ${deckId === 'A' ? 'bg-blue-400' : 'bg-red-400'} rounded-full`}></div>
                </div>
            </div>
            <div className="w-full grid grid-cols-4 gap-2">
               {[1, 2, 3, 4].map(padId => {
                   const cue = hotcues.find(c => c.id === padId);
                   const isSet = !!cue;
                   const deckColorClass = deckId === 'A' ? 'bg-blue-500 hover:bg-blue-400' : 'bg-red-500 hover:bg-red-400';
                   return (
                     <button key={padId} onClick={() => handleHotCueClick(padId)} className={`relative h-12 text-lg font-bold rounded transition-colors text-white ${isSet ? deckColorClass : 'bg-gray-700 hover:bg-gray-600'}`}>
                       {padId}
                       {isShiftPressed && isSet && <span className="absolute bottom-1 right-1 text-[10px] bg-black/50 px-1 rounded">DEL</span>}
                     </button>
                   )
               })}
            </div>
      </div>
      
      <div className="flex items-center justify-center space-x-2 md:space-x-4">
        <div className="flex items-center gap-x-1 md:gap-x-2">
            <button onClick={handleLoopIn} className={`px-3 py-1 text-xs font-bold rounded ${loopStart !== null && loopEnd === null ? 'bg-yellow-500 text-black' : 'bg-gray-700 hover:bg-gray-600'}`}>IN</button>
            <button onClick={handleLoopOut} disabled={loopStart === null} className="px-3 py-1 text-xs font-bold bg-gray-700 hover:bg-gray-600 rounded disabled:opacity-50">OUT</button>
            <button onClick={handleExitLoop} className="px-3 py-1 text-xs font-bold bg-gray-700 hover:bg-gray-600 rounded">EXIT</button>
        </div>

        <button onClick={handleGoToCue} className="p-2 text-xs font-bold bg-yellow-500 hover:bg-yellow-400 text-black rounded-full h-12 w-12 flex items-center justify-center">CUE</button>

        <button onClick={handleTogglePlay}>
          {isPlaying ? <PauseCircleIcon className="w-12 h-12 text-brand-500" /> : <PlayCircleIcon className="w-12 h-12 text-brand-500" />}
        </button>
         <div className="flex flex-col items-center">
            <span className="text-xs font-bold uppercase">Pitch</span>
            <input 
              type="range" 
              min="0.5" 
              max="2" 
              step="0.01" 
              value={playbackRate} 
              onChange={handleRateChange} 
              onDoubleClick={resetRate}
              className="w-20 md:w-24 h-1 accent-brand-500" 
            />
            <div className="flex items-center gap-x-2 mt-1">
                <button onClick={resetRate} className="text-[10px] p-1 bg-gray-700 rounded">RESET</button>
                <button onClick={() => setMasterTempo(!masterTempo)} className={`text-[10px] p-1 rounded ${masterTempo ? 'bg-brand-500 text-white' : 'bg-gray-700'}`}>MT</button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default DJPlayer;