import React, { useState, useEffect } from 'react';
import {
  X,
  Navigation,
  MapPin,
  Car,
  Footprints,
  Clock,
  Sparkles,
  AlertTriangle,
  ArrowRight,
  ShieldCheck,
  Search,
  CheckCircle,
  HelpCircle
} from 'lucide-react';
import { SmartRouteData, VehicleTypeId, DGTBadgeId } from '../types';
import { planSmartRoute, calculateTariff } from '../services/api';
import { VEHICLE_OPTIONS, BADGE_OPTIONS } from './VehicleSelectorModal';
import { LocationAutocompleteInput } from './LocationAutocompleteInput';
import { ParquimetroRoller } from './ParquimetroRoller';

interface RoutePlannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVehicle: VehicleTypeId;
  selectedBadge: DGTBadgeId;
  onVehicleBadgeChange?: (vehicle: VehicleTypeId, badge: DGTBadgeId) => void;
  onSelectRouteOnMap: (route: SmartRouteData) => void;
  onParkAtRecommendedParking: (parking: SmartRouteData['parking']) => void;
}

const PRESET_ORIGINS = [
  { label: 'Atocha', val: 'Estación de Atocha' },
  { label: 'Moncloa', val: 'Intercambiador de Moncloa' },
  { label: 'Plaza de Castilla', val: 'Plaza de Castilla' },
  { label: 'Puerta del Sol', val: 'Puerta del Sol' }
];

const PRESET_DESTINATIONS = [
  { label: 'Calle de Serrano', val: 'Calle de Serrano' },
  { label: 'Gran Vía', val: 'Gran Vía' },
  { label: 'Calle de Fuencarral', val: 'Calle de Fuencarral' },
  { label: 'Calle de Ibiza (Retiro)', val: 'Calle de Ibiza' },
  { label: 'Puerta del Sol', val: 'Puerta del Sol' }
];

export const RoutePlannerModal: React.FC<RoutePlannerModalProps> = ({
  isOpen,
  onClose,
  selectedVehicle,
  selectedBadge,
  onVehicleBadgeChange,
  onSelectRouteOnMap,
  onParkAtRecommendedParking
}) => {
  if (!isOpen) return null;

  const [origen, setOrigen] = useState<string>('Estación de Atocha');
  const [destino, setDestino] = useState<string>('Calle de Serrano');
  const [duracionMinutos, setDuracionMinutos] = useState<number>(120);
  
  // Selector de vehículo y etiqueta interactivo en la propia ruta
  const [vehicle, setVehicle] = useState<VehicleTypeId>(selectedVehicle);
  const [badge, setBadge] = useState<DGTBadgeId>(selectedBadge);

  const [loading, setLoading] = useState<boolean>(false);
  const [routeResult, setRouteResult] = useState<SmartRouteData | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sincronizar estado inicial
  useEffect(() => {
    setVehicle(selectedVehicle);
    setBadge(selectedBadge);
  }, [selectedVehicle, selectedBadge]);

  const handleVehicleChange = (newV: VehicleTypeId) => {
    setVehicle(newV);
    if (onVehicleBadgeChange) onVehicleBadgeChange(newV, badge);
  };

  const handleBadgeChange = (newB: DGTBadgeId) => {
    setBadge(newB);
    if (onVehicleBadgeChange) onVehicleBadgeChange(vehicle, newB);
  };

  const vehicleObj = VEHICLE_OPTIONS.find(v => v.id === vehicle);
  const badgeObj = BADGE_OPTIONS.find(b => b.id === badge);
  const isExempt = vehicleObj?.exento || badgeObj?.exento;

  const handleCalculateRoute = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setLoading(true);
    setErrorMsg(null);

    try {
      const result = await planSmartRoute({
        origen: origen,
        destino: destino,
        tipo_vehiculo: vehicle,
        distintivo_dgt: badge,
        duracion_minutos: duracionMinutos
      });

      setRouteResult(result);
    } catch (err: any) {
      console.error(err);
      setErrorMsg('Hubo un problema al calcular la ruta. Comprueba los lugares seleccionados.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in pointer-events-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-xl w-full overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]">
        {/* Cabecera */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-blue-700 via-indigo-700 to-emerald-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-white/20 rounded-2xl backdrop-blur-md">
              <Navigation className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black leading-tight">Ruta Inteligente SER Madrid</h2>
              <p className="text-xs text-blue-100">OSRM + Nominatim / Photon + Parada en Parking Cercano</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Formulario y Resultados */}
        <div className="p-4 sm:p-6 space-y-4 overflow-y-auto">
          {/* 1. Selector Directo de Vehículo y Distintivo DGT (Requisito: editable aquí mismo) */}
          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-200 space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-[11px] font-bold text-gray-700 uppercase tracking-wider">
                Vehículo y Distintivo DGT para esta ruta
              </span>
              {isExempt && (
                <span className="text-emerald-700 font-bold text-[10px] flex items-center gap-1 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                  <Sparkles className="w-3 h-3 text-emerald-600" /> Exento de pago SER
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2">
              {/* Selector Tipo de Vehículo */}
              <div>
                <label className="block text-[10px] text-gray-500 font-semibold mb-0.5">Tipo de Vehículo</label>
                <select
                  value={vehicle}
                  onChange={(e) => handleVehicleChange(e.target.value as VehicleTypeId)}
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                >
                  {VEHICLE_OPTIONS.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.icono} {v.nombre} {v.exento ? '(Exento)' : ''}
                    </option>
                  ))}
                </select>
              </div>

              {/* Selector Distintivo DGT */}
              <div>
                <label className="block text-[10px] text-gray-500 font-semibold mb-0.5">Distintivo DGT</label>
                <select
                  value={badge}
                  onChange={(e) => handleBadgeChange(e.target.value as DGTBadgeId)}
                  className="w-full px-2.5 py-1.5 bg-white border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-blue-500 text-gray-800"
                >
                  {BADGE_OPTIONS.map((b) => (
                    <option key={b.id} value={b.id}>
                      Etiqueta {b.nombre} {b.exento ? '(100% Gratis)' : ''}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Aviso informativo de la combinación elegida */}
            <p className="text-[11px] text-gray-500 pt-1 border-t border-gray-100 flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>
                {isExempt
                  ? 'Tarifa: 0,00 € (No requiere tique al estar exento).'
                  : badge === 'ECO'
                    ? 'Tarifa con 75% de bonificación sobre precio base municipal.'
                    : badge === 'B'
                      ? 'Tarifa con recargo del +20% sobre precio base municipal.'
                      : badge === 'A'
                        ? 'Atención: Restringido a no residentes en plazas SER.'
                        : 'Tarifa base ordinaria del Ayuntamiento de Madrid.'}
              </span>
            </p>
          </div>

          {/* 2. Formulario de Origen y Destino con Autocompletado Nominatim / Photon / Local */}
          <form onSubmit={handleCalculateRoute} className="space-y-3">
            {/* Origen */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-blue-600" />
                Punto de Origen (Geocodificación / Autocompletado)
              </label>
              <LocationAutocompleteInput
                value={origen}
                onChange={setOrigen}
                placeholder="Escribe calle o punto (ej: Atocha, Puerta del Sol...)"
                iconColor="text-blue-600"
                presets={PRESET_ORIGINS}
              />
            </div>

            {/* Destino */}
            <div>
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-600" />
                Destino Final (Se buscará el parking SER más cercano)
              </label>
              <LocationAutocompleteInput
                value={destino}
                onChange={setDestino}
                placeholder="Escribe calle o destino (ej: Serrano, Gran Vía, Retiro...)"
                iconColor="text-emerald-600"
                presets={PRESET_DESTINATIONS}
              />
            </div>

            {/* 3. Parquímetro Roller / Stepper de Tiempo (Requisito: parquímetro con rueda de sumar/restar) */}
            <div className="pt-1">
              <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1.5">
                Tiempo de estacionamiento en destino (Simulador Parquímetro)
              </label>
              <ParquimetroRoller
                minutos={duracionMinutos}
                onChange={setDuracionMinutos}
                tipoPlaza={routeResult?.parking.color || 'VERDE'}
                isExempt={isExempt}
                sinLimiteTiempo={badgeObj?.sin_limite_tiempo}
                precioTotal={routeResult ? routeResult.parking.tarifa.precio_total : 0.0}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-gradient-to-r from-blue-600 via-indigo-600 to-emerald-600 hover:from-blue-700 hover:to-emerald-700 text-white font-extrabold rounded-2xl shadow-lg transition-all active:scale-98 text-xs sm:text-sm flex items-center justify-center gap-2"
            >
              {loading ? (
                <span>Calculando ruta y parking óptimo...</span>
              ) : (
                <>
                  <Navigation className="w-4 h-4" />
                  <span>Calcular Ruta Óptima (OSRM + Parking SER)</span>
                </>
              )}
            </button>
          </form>

          {errorMsg && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-800 text-xs rounded-xl flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Resultado de la Ruta Multimodal */}
          {routeResult && (
            <div className="space-y-3 pt-2 border-t border-gray-200 animate-fade-in text-xs">
              {/* Resumen General */}
              <div className="p-3.5 bg-gradient-to-r from-gray-900 to-gray-800 text-white rounded-2xl flex items-center justify-between">
                <div>
                  <span className="text-gray-300 text-[10px] uppercase font-bold block">Tiempo total estimado</span>
                  <span className="text-lg font-black text-emerald-400">~{routeResult.resumen_viaje.tiempo_total_min} min</span>
                </div>
                <div className="text-right">
                  <span className="text-gray-300 text-[10px] uppercase font-bold block">Distancia multimodal</span>
                  <span className="text-base font-black">{routeResult.resumen_viaje.distancia_total_km} km</span>
                </div>
              </div>

              {/* Tramo 1: Coche (Conducir hasta el parking con OSRM) */}
              <div className="p-3.5 bg-blue-50/80 border border-blue-200 rounded-2xl flex items-start gap-3">
                <div className="p-2.5 bg-blue-600 text-white rounded-xl shadow-sm shrink-0">
                  <Car className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-blue-950 font-bold text-xs">1. Conducir hasta el Parking SER</strong>
                    <span className="text-blue-700 font-bold">~{routeResult.tramos.coche.tiempo_min} min ({routeResult.tramos.coche.distancia_km} km)</span>
                  </div>
                  <p className="text-blue-900 text-[11px] mt-0.5">
                    Desde <strong>{routeResult.origen.nombre}</strong> hasta la parada en <strong>{routeResult.parking.nombre}</strong>.
                  </p>
                  <span className="text-[10px] text-blue-600 font-medium block mt-1">
                    🛣️ Motor de ruta: {routeResult.tramos.coche.provider || 'OSRM (OpenStreetMap)'}
                  </span>
                </div>
              </div>

              {/* Parada: Tarjeta del Parking SER Recomendado */}
              <div className="p-4 bg-white rounded-2xl border-2 border-emerald-500 shadow-md space-y-2.5">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wide block">
                      🅿️ Parking SER Recomendado (Más próximo al destino)
                    </span>
                    <h4 className="font-extrabold text-sm text-gray-900">{routeResult.parking.nombre}</h4>
                    <p className="text-[11px] text-gray-500">
                      Distrito {routeResult.parking.distrito} ({routeResult.parking.barrio}) • ~{routeResult.parking.plazas_estimadas} plazas
                    </p>
                  </div>
                  <span
                    className={`px-2.5 py-1 rounded-xl font-black text-xs shrink-0 ${
                      routeResult.parking.color === 'VERDE'
                        ? 'bg-green-100 text-green-800 border border-green-300'
                        : 'bg-blue-100 text-blue-800 border border-blue-300'
                    }`}
                  >
                    Zona {routeResult.parking.color}
                  </span>
                </div>

                {/* Desglose de Precio y Normativa para este día y hora */}
                <div className="p-3 bg-gray-50 rounded-xl border border-gray-100 space-y-1.5 text-[11px]">
                  <div className="flex items-center justify-between font-bold">
                    <span className="text-gray-700">Tarifa para {routeResult.parking.tarifa.minutos} min:</span>
                    <span className="text-base text-gray-900 font-black">
                      {routeResult.parking.tarifa.exento ? '0,00 € (Gratis)' : `${routeResult.parking.tarifa.precio_total.toFixed(2)} €`}
                    </span>
                  </div>

                  {routeResult.parking.tarifa.exento ? (
                    <div className="text-emerald-700 font-semibold flex items-center gap-1">
                      <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                      {routeResult.parking.tarifa.motivo_exencion}
                    </div>
                  ) : (
                    <div className="text-gray-500 flex flex-wrap gap-x-2">
                      <span>Base oficial: {routeResult.parking.tarifa.precio_base.toFixed(2)} €</span>
                      {routeResult.parking.tarifa.factor_dgt_porcentaje !== 0 && (
                        <span className="text-emerald-700 font-semibold">
                          Bonificación DGT {routeResult.parking.tarifa.distintivo_dgt}: {routeResult.parking.tarifa.factor_dgt_porcentaje}%
                        </span>
                      )}
                    </div>
                  )}

                  {/* Aviso de horario o ajuste de recordatorio (finPago = min(ahora+min, finSER)) */}
                  {routeResult.parking.periodo_ajustado.limitado_por_ser && (
                    <div className="p-2 bg-amber-50 border border-amber-200 rounded-lg text-amber-900 font-medium">
                      ⏰ {routeResult.parking.periodo_ajustado.explicacion}
                    </div>
                  )}
                </div>

                {/* Botón rápido para aparcar en este parking */}
                <button
                  type="button"
                  onClick={() => {
                    onParkAtRecommendedParking(routeResult.parking);
                    onClose();
                  }}
                  className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm transition-all active:scale-98"
                >
                  <span>🚗</span>
                  Aparcar en este parking recomendado
                </button>
              </div>

              {/* Tramo 2: A pie hasta el Destino Final */}
              <div className="p-3.5 bg-emerald-50/80 border border-emerald-200 rounded-2xl flex items-start gap-3">
                <div className="p-2.5 bg-emerald-600 text-white rounded-xl shadow-sm shrink-0">
                  <Footprints className="w-4 h-4" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <strong className="text-emerald-950 font-bold text-xs">2. Caminar hasta el Destino Final</strong>
                    <span className="text-emerald-800 font-bold">~{routeResult.tramos.pie.tiempo_min} min ({routeResult.tramos.pie.distancia_m} m)</span>
                  </div>
                  <p className="text-emerald-900 text-[11px] mt-0.5">
                    Desde el parking hasta <strong>{routeResult.destino.nombre}</strong>.
                  </p>
                </div>
              </div>

              {/* Botón para ver en el mapa */}
              <button
                type="button"
                onClick={() => {
                  onSelectRouteOnMap(routeResult);
                  onClose();
                }}
                className="w-full py-2.5 bg-gray-900 hover:bg-black text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 shadow-md transition-all active:scale-98"
              >
                <span>🗺️</span>
                Ver trazado completo en el mapa
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
