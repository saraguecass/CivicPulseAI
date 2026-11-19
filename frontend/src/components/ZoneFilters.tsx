import React from 'react';
import { FilterState } from '../types';

interface ZoneFiltersProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
}

const DISTRITOS = [
  { value: '', label: 'Todos los distritos' },
  { value: 'Salamanca', label: 'Salamanca' },
  { value: 'Chamberí', label: 'Chamberí' },
  { value: 'Retiro', label: 'Retiro' },
  { value: 'Centro', label: 'Centro' },
];

export const ZoneFilters: React.FC<ZoneFiltersProps> = ({ filters, onChange }) => {
  const toggleVerde = () => onChange({ ...filters, showVerde: !filters.showVerde });
  const toggleAzul = () => onChange({ ...filters, showAzul: !filters.showAzul });
  const setDistrito = (distrito: string) => onChange({ ...filters, distrito });

  return (
    <div className="flex flex-wrap items-center gap-2 bg-white/95 backdrop-blur-md px-3.5 py-2 rounded-2xl shadow-lg border border-gray-200 text-xs sm:text-sm font-medium">
      {/* Botón Verde */}
      <button
        onClick={toggleVerde}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
          filters.showVerde
            ? 'bg-green-50 border-green-500 text-green-700 shadow-sm'
            : 'bg-gray-50 border-gray-200 text-gray-400 opacity-60'
        }`}
      >
        <span className="w-2.5 h-2.5 rounded-full bg-green-500" />
        Verde
      </button>

      {/* Botón Azul */}
      <button
        onClick={toggleAzul}
        className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
          filters.showAzul
            ? 'bg-blue-50 border-blue-500 text-blue-700 shadow-sm'
            : 'bg-gray-50 border-gray-200 text-gray-400 opacity-60'
        }`}
      >
        <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
        Azul
      </button>

      {/* Selector de Distrito */}
      <select
        value={filters.distrito}
        onChange={(e) => setDistrito(e.target.value)}
        className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 text-gray-700 rounded-xl focus:outline-none cursor-pointer"
      >
        {DISTRITOS.map((d) => (
          <option key={d.value} value={d.value}>
            {d.label}
          </option>
        ))}
      </select>
    </div>
  );
};
