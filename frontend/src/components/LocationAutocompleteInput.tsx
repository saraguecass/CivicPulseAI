import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2 } from 'lucide-react';
import { fetchGeocodingAutocomplete } from '../services/api';

interface LocationAutocompleteInputProps {
  value: string;
  onChange: (val: string) => void;
  onSelectCoordinates?: (coords: [number, number]) => void;
  placeholder?: string;
  iconColor?: string;
  presets?: { label: string; val: string }[];
}

export const LocationAutocompleteInput: React.FC<LocationAutocompleteInputProps> = ({
  value,
  onChange,
  onSelectCoordinates,
  placeholder = 'Buscar calle o lugar...',
  iconColor = 'text-blue-600',
  presets = []
}) => {
  const [suggestions, setSuggestions] = useState<Array<{ label: string; lat: number; lng: number; tipo: string; distrito?: string }>>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const debounceTimer = useRef<any>(null);

  useEffect(() => {
    // Cerrar sugerencias al hacer click fuera
    const handleClickOutside = (e: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const text = e.target.value;
    onChange(text);

    if (debounceTimer.current) clearTimeout(debounceTimer.current);

    if (!text || text.trim().length < 2) {
      setSuggestions([]);
      setIsOpen(false);
      return;
    }

    setLoading(true);
    debounceTimer.current = setTimeout(async () => {
      try {
        const results = await fetchGeocodingAutocomplete(text);
        setSuggestions(results);
        setIsOpen(results.length > 0);
      } catch (err) {
        console.error('Error autocompletando:', err);
      } finally {
        setLoading(false);
      }
    }, 200);
  };

  const handleSelectSuggestion = (item: { label: string; lat: number; lng: number }) => {
    onChange(item.label);
    if (onSelectCoordinates) {
      onSelectCoordinates([item.lng, item.lat]);
    }
    setIsOpen(false);
  };

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div className="relative">
        <input
          type="text"
          value={value}
          onChange={handleInputChange}
          onFocus={() => {
            if (suggestions.length > 0) setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full pl-9 pr-8 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
          required
        />
        <MapPin className={`w-4 h-4 ${iconColor} absolute left-3 top-1/2 -translate-y-1/2`} />
        {loading && (
          <Loader2 className="w-4 h-4 text-gray-400 absolute right-3 top-1/2 -translate-y-1/2 animate-spin" />
        )}
      </div>

      {/* Menú flotante de autocompletado */}
      {isOpen && suggestions.length > 0 && (
        <div className="absolute left-0 right-0 mt-1 bg-white rounded-2xl shadow-2xl border border-gray-200 z-50 overflow-hidden divide-y divide-gray-100 max-h-56 overflow-y-auto">
          {suggestions.map((item, idx) => (
            <button
              key={`${item.label}-${idx}`}
              type="button"
              onClick={() => handleSelectSuggestion(item)}
              className="w-full text-left px-3.5 py-2.5 hover:bg-blue-50 transition-colors flex items-center justify-between text-xs group"
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <span className="text-gray-400 group-hover:text-blue-600 shrink-0">📍</span>
                <div className="truncate">
                  <span className="font-bold text-gray-800 block truncate group-hover:text-blue-900">
                    {item.label}
                  </span>
                  {item.distrito && (
                    <span className="text-[10px] text-gray-400 block truncate">
                      Distrito {item.distrito}
                    </span>
                  )}
                </div>
              </div>
              <span className="text-[10px] font-semibold text-gray-400 uppercase shrink-0 ml-2">
                {item.tipo.replace('_', ' ')}
              </span>
            </button>
          ))}
        </div>
      )}

      {/* Presets rápidos */}
      {presets.length > 0 && (
        <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto pb-1 text-[11px]">
          {presets.map((p) => (
            <button
              key={p.val}
              type="button"
              onClick={() => {
                onChange(p.val);
                setIsOpen(false);
              }}
              className={`px-2.5 py-0.5 rounded-lg border whitespace-nowrap transition-colors ${
                value === p.val
                  ? 'bg-blue-100 text-blue-800 border-blue-300 font-bold'
                  : 'bg-white text-gray-600 border-gray-200 hover:bg-gray-50'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};
