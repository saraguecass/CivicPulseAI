import React, { useState, useEffect } from 'react';
import { Map } from './components/Map';
import { SearchBar } from './components/SearchBar';
import { ZoneFilters } from './components/ZoneFilters';
import { ParkingModal } from './components/ParkingModal';
import { ActiveParkingBanner } from './components/ActiveParkingBanner';
import { SERGeoJSONFeatureCollection, ActiveParking, FilterState, StreetSearchResult } from './types';
import { fetchZonas, fetchActiveParking } from './services/api';
import { registerServiceWorker } from './services/notifications';
import { MapPin, Navigation, Info } from 'lucide-react';

const DISTRICT_VIEWPORTS: Record<string, { center: [number, number]; zoom: number }> = {
  '': { center: [-3.688, 40.428], zoom: 13 }, // Todo Madrid
  'Arganzuela': { center: [-3.69814, 40.39883], zoom: 14 },
  'Carabanchel': { center: [-3.71535, 40.39585], zoom: 14.5 },
  'Centro': { center: [-3.70569, 40.41777], zoom: 14 },
  'Chamartín': { center: [-3.67655, 40.4602], zoom: 13.5 },
  'Chamberí': { center: [-3.70437, 40.43633], zoom: 14.2 },
  'Ciudad Lineal': { center: [-3.65413, 40.44195], zoom: 13.8 },
  'Fuencarral - El Pardo': { center: [-3.70135, 40.48041], zoom: 14.5 },
  'Latina': { center: [-3.73233, 40.41038], zoom: 14.5 },
  'Moncloa - Aravaca': { center: [-3.7228, 40.44424], zoom: 13.8 },
  'Retiro': { center: [-3.67737, 40.4087], zoom: 14 },
  'Salamanca': { center: [-3.67581, 40.43174], zoom: 14 },
  'Tetuán': { center: [-3.7003, 40.46054], zoom: 14 },
  'Usera': { center: [-3.70576, 40.3863], zoom: 14.5 },
};

export const App: React.FC = () => {
  const [geojsonData, setGeojsonData] = useState<SERGeoJSONFeatureCollection | null>(null);
  const [filters, setFilters] = useState<FilterState>({
    showVerde: true,
    showAzul: true,
    distrito: ''
  });
  const [activeParking, setActiveParking] = useState<ActiveParking | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCoords, setSelectedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [flyToCoords, setFlyToCoords] = useState<[number, number] | null>(null);
  const [showLegend, setShowLegend] = useState(false);

  // Inicializar Service Worker PWA y cargar datos iniciales
  useEffect(() => {
    registerServiceWorker();

    // Cargar tramos SER
    loadZonas();

    // Comprobar estacionamiento activo existente
    fetchActiveParking().then((data) => {
      if (data) setActiveParking(data);
    });
  }, []);

  // Recargar zonas y centrar automáticamente el mapa cuando cambia el filtro de distrito
  useEffect(() => {
    loadZonas();

    const target = DISTRICT_VIEWPORTS[filters.distrito];
    if (target) {
      setFlyToCoords(target.center);
    }
  }, [filters.distrito]);

  const loadZonas = async () => {
    try {
      const data = await fetchZonas({
        distrito: filters.distrito || undefined
      });
      setGeojsonData(data);
    } catch (err) {
      console.error('Error cargando zonas:', err);
    }
  };

  const handleSelectStreet = (street: StreetSearchResult) => {
    // Si la calle pertenece a un distrito distinto al filtro actual, cambiamos al distrito de la calle
    // para que se carguen y pinten sus tramos en el mapa
    if (filters.distrito && filters.distrito.toLowerCase() !== street.distrito.toLowerCase()) {
      setFilters(prev => ({
        ...prev,
        distrito: street.distrito
      }));
    }
    setFlyToCoords(street.center_coords);
  };

  const handleOpenParkingModal = () => {
    // Si el usuario tiene geolocalización, la usamos, sino el centro de Madrid
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setSelectedCoords({ lat: pos.coords.latitude, lng: pos.coords.longitude });
          setIsModalOpen(true);
        },
        () => {
          setSelectedCoords({ lat: 40.428, lng: -3.688 });
          setIsModalOpen(true);
        }
      );
    } else {
      setSelectedCoords({ lat: 40.428, lng: -3.688 });
      setIsModalOpen(true);
    }
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col bg-gray-100 font-sans">
      {/* Mapa de fondo completo */}
      <div className="absolute inset-0 z-0">
        <Map
          geojsonData={geojsonData}
          filters={filters}
          activeParking={activeParking}
          onSelectLocation={(coords) => {
            setSelectedCoords(coords);
            setIsModalOpen(true);
          }}
          flyToCoords={flyToCoords}
        />
      </div>

      {/* Barra superior flotante (Buscador + Filtros) */}
      <div className="relative z-10 p-3 sm:p-5 flex flex-col gap-3 pointer-events-none">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pointer-events-auto">
          {/* Logo y Nombre de la App */}
          <div className="flex items-center gap-3 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg border border-gray-200 self-start">
            <img src="/spotly-logo.png"alt="Logo de Spotly"
            className="w-8 h-8 rounded-xl object-contain"
            />
            <div>
              <h1 className="font-extrabold text-sm text-gray-900 leading-none">Spotly</h1>
              <span className="text-[10px] font-semibold text-emerald-600 tracking-wide uppercase">SER Madrid 2026</span>
            </div>
          </div>

          {/* Buscador de calles con autocompletado y plazas */}
          <SearchBar onSelectStreet={handleSelectStreet} />

          {/* Filtros de Verde / Azul / Distrito */}
          <ZoneFilters filters={filters} onChange={setFilters} />
        </div>

        {/* Banner de Estacionamiento Activo y Alerta de 30 minutos */}
        {activeParking && (
          <div className="max-w-xl w-full self-center pointer-events-auto mt-1 animate-fade-in">
            <ActiveParkingBanner
              parking={activeParking}
              onParkingEnded={() => setActiveParking(null)}
              onCenterOnCar={(coords) => setFlyToCoords(coords)}
            />
          </div>
        )}
      </div>

      {/* Botón flotante inferior para aparcar coche */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-3">
        <button
          onClick={handleOpenParkingModal}
          className="flex items-center gap-2.5 px-6 py-3.5 bg-white hover:bg-gray-300 text-black font-bold text-sm rounded-full shadow-2xl transition-all active:scale-95 border-2 border-white/20"
        >
          <span className="text-base">🚗</span>
          Aparcar mi coche aquí
        </button>

        <button
          onClick={() => setShowLegend(!showLegend)}
          className="p-3.5 bg-white/95 hover:bg-white text-gray-700 rounded-full shadow-xl border border-gray-200 transition-all active:scale-95"
          title="Ver leyenda de colores SER"
        >
          <Info className="w-5 h-5 text-gray-600" />
        </button>
      </div>

      {/* Leyenda explicativa SER */}
      {showLegend && (
        <div className="absolute bottom-20 left-6 z-20 bg-white/95 backdrop-blur-md p-4 rounded-2xl shadow-2xl border border-gray-200 text-xs max-w-xs animate-fade-in">
          <h4 className="font-bold text-gray-900 mb-2">Regulación SER Madrid</h4>
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <span className="w-3 h-3 rounded-full bg-green-500 mt-0.5 shrink-0" />
              <div>
                <strong className="text-green-800">Zona Verde:</strong> Residentes del barrio sin límite de tiempo; no residentes máx. 2 horas.
              </div>
            </div>
            <div className="flex items-start gap-2">
              <span className="w-3 h-3 rounded-full bg-blue-500 mt-0.5 shrink-0" />
              <div>
                <strong className="text-blue-800">Zona Azul:</strong> Cualquier vehículo máx. 4 horas; rotación comercial.
              </div>
            </div>
          </div>
          <button
            onClick={() => setShowLegend(false)}
            className="mt-3 w-full py-1 bg-gray-100 hover:bg-gray-200 text-gray-700 font-semibold rounded-lg text-[11px]"
          >
            Entendido
          </button>
        </div>
      )}

      {/* Modal para crear estacionamiento */}
      <ParkingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        coords={selectedCoords}
        onParkingCreated={(parking) => setActiveParking(parking)}
      />
    </div>
  );
};
