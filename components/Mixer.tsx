import React from 'react';
import RotaryKnob from './RotaryKnob';
import VerticalFader from './VerticalFader';
import { MixerControls } from '../types';

interface MixerProps {
  controlsA: MixerControls;
  controlsB: MixerControls;
  vuLevelA: number;
  vuLevelB: number;
  crossfader: number;
  onControlsAChange: (updates: Partial<MixerControls>) => void;
  onControlsBChange: (updates: Partial<MixerControls>) => void;
  onCrossfaderChange: (value: number) => void;
}

const VUMeter: React.FC<{ level: number }> = React.memo(({ level }) => {
    const segments = 12;
    const activeSegments = Math.round(level * segments * 5); // Sensitivity multiplier
    return (
        <div className="flex flex-col-reverse gap-1 p-1 bg-black/50 rounded-md h-48 w-6 items-center">
            {Array.from({ length: segments }).map((_, i) => {
                const isActive = i < activeSegments;
                let color = 'bg-green-500';
                if (i >= segments * 0.6) color = 'bg-yellow-500';
                if (i >= segments * 0.85) color = 'bg-red-500';
                return <div key={i} className={`w-3 h-2.5 rounded-sm transition-colors ${isActive ? color : 'bg-gray-600'}`}></div>
            })}
        </div>
    );
});

const Mixer: React.FC<MixerProps> = ({
  controlsA, controlsB, vuLevelA, vuLevelB, crossfader,
  onControlsAChange, onControlsBChange, onCrossfaderChange
}) => {
  return (
    <div className="bg-gray-800 dark:bg-black border border-gray-700 p-4 rounded-lg flex flex-col items-center gap-4">
      <div className="flex justify-center gap-4">
        {/* Channel A */}
        <div className="flex flex-col items-center gap-4 p-2 bg-black/20 rounded-md">
          <RotaryKnob label="HIGH" value={controlsA.high} min={-40} max={40} onChange={(v) => onControlsAChange({ high: v })} onDoubleClick={() => onControlsAChange({ high: 0 })} />
          <RotaryKnob label="MID" value={controlsA.mid} min={-40} max={40} onChange={(v) => onControlsAChange({ mid: v })} onDoubleClick={() => onControlsAChange({ mid: 0 })} />
          <RotaryKnob label="LOW" value={controlsA.low} min={-40} max={40} onChange={(v) => onControlsAChange({ low: v })} onDoubleClick={() => onControlsAChange({ low: 0 })} />
          <RotaryKnob label="FILTER" value={controlsA.filter} min={-1} max={1} onChange={(v) => onControlsAChange({ filter: v })} onDoubleClick={() => onControlsAChange({ filter: 0 })} />
        </div>
        
        {/* Faders and VUs */}
        <div className="flex items-end gap-2 pt-10">
            <div className="flex flex-col items-center gap-2">
                <VerticalFader value={controlsA.volume} onChange={(e) => onControlsAChange({ volume: parseFloat(e.target.value) })} />
                <span className="font-bold text-lg text-blue-400">A</span>
            </div>
            <VUMeter level={vuLevelA} />
            <VUMeter level={vuLevelB} />
            <div className="flex flex-col items-center gap-2">
                <VerticalFader value={controlsB.volume} onChange={(e) => onControlsBChange({ volume: parseFloat(e.target.value) })} />
                <span className="font-bold text-lg text-red-400">B</span>
            </div>
        </div>

        {/* Channel B */}
        <div className="flex flex-col items-center gap-4 p-2 bg-black/20 rounded-md">
          <RotaryKnob label="HIGH" value={controlsB.high} min={-40} max={40} onChange={(v) => onControlsBChange({ high: v })} onDoubleClick={() => onControlsBChange({ high: 0 })} />
          <RotaryKnob label="MID" value={controlsB.mid} min={-40} max={40} onChange={(v) => onControlsBChange({ mid: v })} onDoubleClick={() => onControlsBChange({ mid: 0 })} />
          <RotaryKnob label="LOW" value={controlsB.low} min={-40} max={40} onChange={(v) => onControlsBChange({ low: v })} onDoubleClick={() => onControlsBChange({ low: 0 })} />
          <RotaryKnob label="FILTER" value={controlsB.filter} min={-1} max={1} onChange={(v) => onControlsBChange({ filter: v })} onDoubleClick={() => onControlsBChange({ filter: 0 })} />
        </div>
      </div>

      {/* Crossfader */}
      <div className="w-full max-w-xs pt-4">
        <input
          type="range"
          min="-1"
          max="1"
          step="0.01"
          value={crossfader}
          onChange={(e) => onCrossfaderChange(parseFloat(e.target.value))}
          className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-brand-500"
        />
      </div>
    </div>
  );
};

export default Mixer;