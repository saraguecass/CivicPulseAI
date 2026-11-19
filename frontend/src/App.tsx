import React, { useState, useEffect } from 'react';
import { Map } from './components/Map';
import { SearchBar } from './components/SearchBar';
import { ZoneFilters } from './components/ZoneFilters';
import { ParkingModal } from './components/ParkingModal';
import { ActiveParkingBanner } from './components/ActiveParkingBanner';
import { ScheduleStatusPill } from './components/ScheduleStatusPill';
import { VehicleSelectorModal, VEHICLE_OPTIONS, BADGE_OPTIONS } from './components/VehicleSelectorModal';
import { RoutePlannerModal } from './components/RoutePlannerModal';
import {
  SERGeoJSONFeatureCollection,
  ActiveParking,
  FilterState,
  StreetSearchResult,
  VehicleTypeId,
  DGTBadgeId,
  SmartRouteData
} from './types';
import { fetchZonas, fetchActiveParking } from './services/api';
import { registerServiceWorker } from './services/notifications';
import { MapPin, Navigation, Info, Car, Footprints, X, Sparkles, Route } from 'lucide-react';

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
  const [modalInitialCalle, setModalInitialCalle] = useState<string>('Zona SER Madrid');
  const [modalInitialTipoPlaza, setModalInitialTipoPlaza] = useState<'VERDE' | 'AZUL'>('VERDE');
  const [flyToCoords, setFlyToCoords] = useState<[number, number] | null>(null);
  const [showLegend, setShowLegend] = useState(false);

  // Estados de Vehículo y Distintivo DGT (Persistidos en localStorage)
  const [selectedVehicle, setSelectedVehicle] = useState<VehicleTypeId>(() => {
    return (localStorage.getItem('ser_vehicle_type') as VehicleTypeId) || 'turismo';
  });
  const [selectedBadge, setSelectedBadge] = useState<DGTBadgeId>(() => {
    return (localStorage.getItem('ser_dgt_badge') as DGTBadgeId) || 'ECO';
  });
  const [isVehicleModalOpen, setIsVehicleModalOpen] = useState(false);

  // Estado del Planificador de Rutas Multimodales
  const [isRouteModalOpen, setIsRouteModalOpen] = useState(false);
  const [activeRoute, setActiveRoute] = useState<SmartRouteData | null>(null);

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
    setModalInitialCalle('Zona SER Madrid');
    setModalInitialTipoPlaza('VERDE');
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

  const handleSaveVehiclePreferences = (vehicle: VehicleTypeId, badge: DGTBadgeId) => {
    setSelectedVehicle(vehicle);
    setSelectedBadge(badge);
    localStorage.setItem('ser_vehicle_type', vehicle);
    localStorage.setItem('ser_dgt_badge', badge);
  };

  const handleParkAtRecommendedParking = (parking: SmartRouteData['parking']) => {
    setSelectedCoords({ lat: parking.coords[1], lng: parking.coords[0] });
    setModalInitialCalle(parking.nombre);
    setModalInitialTipoPlaza(parking.color);
    setIsModalOpen(true);
  };

  const currentVehicleObj = VEHICLE_OPTIONS.find(v => v.id === selectedVehicle);
  const currentBadgeObj = BADGE_OPTIONS.find(b => b.id === selectedBadge);

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col bg-gray-100 font-sans">
      {/* Mapa de fondo completo */}
      <div className="absolute inset-0 z-0">
        <Map
          geojsonData={geojsonData}
          filters={filters}
          activeParking={activeParking}
          activeRoute={activeRoute}
          onSelectLocation={(coords) => {
            setSelectedCoords(coords);
            setModalInitialCalle('Ubicación seleccionada en mapa');
            setIsModalOpen(true);
          }}
          flyToCoords={flyToCoords}
          onClearRoute={() => setActiveRoute(null)}
        />
      </div>

      {/* Barra superior flotante */}
      <div className="relative z-10 p-3 sm:p-5 flex flex-col gap-2.5 pointer-events-none">
        <div className="flex flex-wrap items-center justify-between gap-2.5 pointer-events-auto">
          {/* Logo y Nombre de la App */}
          <div className="flex items-center gap-3 bg-white/95 backdrop-blur-md px-4 py-2.5 rounded-2xl shadow-lg border border-gray-200 self-start">
            <img src="/spotly-logo.png" alt="Logo de Spotly"
              className="w-8 h-8 rounded-xl object-contain"
            />
            <div>
              <h1 className="font-extrabold text-sm text-gray-900 leading-none">Spotly</h1>
              <span className="text-[10px] font-semibold text-emerald-600 tracking-wide uppercase">SER Madrid 2026</span>
            </div>
          </div>

          {/* Estado de Horario SER en Tiempo Real (Pastilla informativa) */}
          <ScheduleStatusPill />

          {/* Botón Selector de Vehículo y Distintivo DGT */}
          <button
            type="button"
            onClick={() => setIsVehicleModalOpen(true)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-xl shadow-md border border-gray-200 hover:bg-gray-50 transition-all text-xs font-semibold text-gray-800"
            title="Seleccionar tipo de vehículo y distintivo DGT"
          >
            <span>{currentVehicleObj?.icono || '🚗'}</span>
            <span className="hidden sm:inline">{currentVehicleObj?.nombre.split(' ')[0]}</span>
            <span className={`px-1.5 py-0.5 rounded-md font-bold text-[10px] ${currentBadgeObj?.bg} ${currentBadgeObj?.color} border ${currentBadgeObj?.border}`}>
              {currentBadgeObj?.nombre}
            </span>
            {currentVehicleObj?.exento || currentBadgeObj?.exento ? (
              <span className="text-emerald-700 font-bold text-[10px] flex items-center gap-0.5">
                <Sparkles className="w-3 h-3 text-emerald-600" /> Exento
              </span>
            ) : null}
          </button>

          {/* Botón Abrir Planificador de Ruta Multimodal */}
          <button
            type="button"
            onClick={() => setIsRouteModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl shadow-md transition-all text-xs font-bold active:scale-95"
            title="Calcular ruta en coche con parada en parking más cercano y andar a destino"
          >
            <Route className="w-4 h-4" />
            <span>Planificar Ruta SER</span>
          </button>

          {/* Buscador de calles con autocompletado y plazas */}
          <SearchBar onSelectStreet={handleSelectStreet} />

          {/* Filtros de Verde / Azul / Distrito */}
          <ZoneFilters filters={filters} onChange={setFilters} />
        </div>

        {/* Banner de Ruta Activa Trazada en el Mapa */}
        {
          activeRoute && (
            <div className="max-w-xl w-full self-center pointer-events-auto bg-white/95 backdrop-blur-md p-3 rounded-2xl shadow-xl border border-blue-200 flex items-center justify-between gap-3 text-xs animate-fade-in">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-blue-600 text-white rounded-xl">
                  <Navigation className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-extrabold text-gray-900 block">
                    Ruta activa: {activeRoute.origen.nombre} ➔ {activeRoute.parking.nombre} (Parking) ➔ {activeRoute.destino.nombre}
                  </span>
                  <span className="text-gray-500 text-[11px]">
                    🚗 Coche {activeRoute.tramos.coche.distancia_km} km • 🚶 Andando {activeRoute.tramos.pie.distancia_m} m (~{activeRoute.resumen_viaje.tiempo_total_min} min total) • Tarifa: <strong>{activeRoute.parking.tarifa.exento ? 'Gratis (Exento)' : `${activeRoute.parking.tarifa.precio_total.toFixed(2)} €`}</strong>
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleParkAtRecommendedParking(activeRoute.parking)}
                  className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg text-[11px] whitespace-nowrap"
                >
                  Aparcar
                </button>
                <button
                  type="button"
                  onClick={() => setActiveRoute(null)}
                  className="p-1 text-gray-400 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                  title="Quitar ruta del mapa"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          )
        }

        {/* Banner de Estacionamiento Activo y Alerta de 30 minutos */}
        {
          activeParking && (
            <div className="max-w-xl w-full self-center pointer-events-auto mt-1 animate-fade-in">
              <ActiveParkingBanner
                parking={activeParking}
                onParkingEnded={() => setActiveParking(null)}
                onCenterOnCar={(coords) => setFlyToCoords(coords)}
              />
            </div>
          )
        }
      </div >

      {/* Botones flotantes inferiores */}
      < div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-10 flex items-center gap-2.5" >
        <button
          onClick={handleOpenParkingModal}
          className="flex items-center gap-2.5 px-6 py-3.5 bg-white hover:bg-gray-300 text-black font-bold text-sm rounded-full shadow-2xl transition-all active:scale-95 border-2 border-white/20"
        >
          <span>🚗</span>
          Aparcar aquí
        </button>

        <button
          onClick={() => setIsRouteModalOpen(true)}
          className="flex items-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs sm:text-sm rounded-full shadow-2xl transition-all active:scale-95 border-2 border-white/20"
        >
          <Route className="w-4 h-4" />
          <span className="hidden sm:inline">Ruta con Parking</span>
        </button>

        <button
          onClick={() => setShowLegend(!showLegend)}
          className="p-3 bg-white/95 hover:bg-white text-gray-700 rounded-full shadow-xl border border-gray-200 transition-all active:scale-95"
          title="Ver leyenda de colores SER"
        >
          <Info className="w-4 h-4 text-gray-600" />
        </button>
      </div >

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
            <div className="p-2 bg-gray-50 rounded-lg text-[11px] text-gray-600">
              <strong>Horario:</strong> L-V 9–21h, Sábados 9–15h, Domingos gratis.
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

      {/* Modal de Configuración de Vehículo y Distintivo DGT */}
      <VehicleSelectorModal
        isOpen={isVehicleModalOpen}
        onClose={() => setIsVehicleModalOpen(false)}
        selectedVehicle={selectedVehicle}
        selectedBadge={selectedBadge}
        onSave={handleSaveVehiclePreferences}
      />

      {/* Modal de Planificador de Rutas Multimodales */}
      <RoutePlannerModal
        isOpen={isRouteModalOpen}
        onClose={() => setIsRouteModalOpen(false)}
        selectedVehicle={selectedVehicle}
        selectedBadge={selectedBadge}
        onVehicleBadgeChange={handleSaveVehiclePreferences}
        onSelectRouteOnMap={(route) => setActiveRoute(route)}
        onParkAtRecommendedParking={handleParkAtRecommendedParking}
      />

      {/* Modal para crear estacionamiento */}
      <ParkingModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        coords={selectedCoords}
        initialCalle={modalInitialCalle}
        initialTipoPlaza={modalInitialTipoPlaza}
        selectedVehicle={selectedVehicle}
        selectedBadge={selectedBadge}
        onParkingCreated={(parking) => setActiveParking(parking)}
      />
    </div>
  );
};
