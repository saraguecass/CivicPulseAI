import React, { useState, useEffect, useRef } from 'react';
import { Search, MapPin, X, Car } from 'lucide-react';
import { StreetSearchResult } from '../types';
import { searchCalles } from '../services/api';

interface SearchBarProps {
  onSelectStreet: (result: StreetSearchResult) => void;
}

export const SearchBar: React.FC<SearchBarProps> = ({ onSelectStreet }) => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<StreetSearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (query.trim().length < 2) {
      setResults([]);
      setIsOpen(false);
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const data = await searchCalles(query);
        setResults(data);
        setIsOpen(true);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => clearTimeout(timer);
  }, [query]);

  // Cerrar dropdown al hacer click fuera
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (item: StreetSearchResult) => {
    onSelectStreet(item);
    setQuery(item.nombre_calle);
    setIsOpen(false);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full max-w-md" ref={dropdownRef}>
      <div className="relative flex items-center shadow-lg rounded-2xl bg-white border border-gray-200">
        <Search className="w-5 h-5 ml-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onFocus={() => results.length > 0 && setIsOpen(true)}
          placeholder="Buscar calle en Madrid (ej: Serrano, Goya)..."
          className="w-full py-3 px-3 text-sm text-gray-800 bg-transparent rounded-2xl focus:outline-none"
        />
        {query && (
          <button
            onClick={clearSearch}
            className="p-1 mr-3 text-gray-400 hover:text-gray-600 rounded-full"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Resultados de búsqueda flotantes */}
      {isOpen && (
        <div className="absolute left-0 right-0 mt-2 bg-white rounded-2xl shadow-2xl border border-gray-100 overflow-hidden z-50 max-h-80 overflow-y-auto">
          {loading ? (
            <div className="p-4 text-center text-sm text-gray-500">Buscando tramos SER...</div>
          ) : results.length === 0 ? (
            <div className="p-4 text-center text-sm text-gray-500">
              No se encontraron calles SER con "{query}".
            </div>
          ) : (
            results.map((item, idx) => (
              <button
                key={idx}
                onClick={() => handleSelect(item)}
                className="w-full text-left p-3.5 hover:bg-gray-50 border-b border-gray-100 last:border-b-0 flex items-start gap-3 transition-colors"
              >
                <div className="mt-1 p-2 bg-gray-100 rounded-xl text-gray-700">
                  <MapPin className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-semibold text-gray-900 text-sm truncate">
                      {item.nombre_calle}
                    </span>
                    <span className="text-xs text-gray-500 shrink-0">
                      {item.distrito}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                    {/* Badge tipo estacionamiento */}
                    {item.tipo_estacionamiento === 'VERDE' && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        Zona Verde
                      </span>
                    )}
                    {item.tipo_estacionamiento === 'AZUL' && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Zona Azul
                      </span>
                    )}
                    {item.tipo_estacionamiento === 'MIXTO' && (
                      <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
                        Verde y Azul
                      </span>
                    )}

                    {/* Total de plazas */}
                    <span className="text-xs text-gray-600 flex items-center gap-1 font-medium">
                      <Car className="w-3.5 h-3.5 text-gray-400" />
                      {item.total_plazas} plazas
                      {item.tipo_estacionamiento === 'MIXTO' && (
                        <span className="text-gray-400 font-normal">
                          ({item.plazas_verde}V / {item.plazas_azul}A)
                        </span>
                      )}
                    </span>
                  </div>
                </div>
              </button>
            ))
          )}
        </div>
      )}
    </div>
  );
};
