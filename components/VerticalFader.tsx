import React from 'react';

interface VerticalFaderProps {
  value: number;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const VerticalFader: React.FC<VerticalFaderProps> = ({ value, onChange }) => {
  return (
    <div className="flex justify-center items-center h-48 w-10">
      <input
        type="range"
        min="0"
        max="1"
        step="0.01"
        value={value}
        onChange={onChange}
        className="w-36 h-2 -rotate-90 appearance-none bg-gray-700 rounded-full cursor-pointer accent-brand-500"
      />
    </div>
  );
};

export default VerticalFader;