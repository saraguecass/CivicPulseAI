import React, { useState, useEffect } from 'react';
import { X, Clock, MapPin, Bell, ShieldCheck, Sparkles, AlertCircle } from 'lucide-react';
import { createParking, calculateTariff, fetchCurrentSchedule } from '../services/api';
import { subscribeToPushNotifications } from '../services/notifications';
import { ActiveParking, VehicleTypeId, DGTBadgeId, SERScheduleStatus, SERTariffResponse } from '../types';
import { VEHICLE_OPTIONS, BADGE_OPTIONS } from './VehicleSelectorModal';
import { ParquimetroRoller } from './ParquimetroRoller';

interface ParkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  coords: { lat: number; lng: number } | null;
  initialCalle?: string;
  initialTipoPlaza?: 'VERDE' | 'AZUL';
  selectedVehicle: VehicleTypeId;
  selectedBadge: DGTBadgeId;
  onParkingCreated: (parking: ActiveParking) => void;
}

export const ParkingModal: React.FC<ParkingModalProps> = ({
  isOpen,
  onClose,
  coords,
  initialCalle = 'Zona SER Madrid',
  initialTipoPlaza = 'VERDE',
  selectedVehicle,
  selectedBadge,
  onParkingCreated
}) => {
  if (!isOpen || !coords) return null;

  const [calle, setCalle] = useState(initialCalle);
  const [tipoPlaza, setTipoPlaza] = useState<'VERDE' | 'AZUL'>(initialTipoPlaza);
  const [duracionMinutos, setDuracionMinutos] = useState<number>(120);
  const [vehicle, setVehicle] = useState<VehicleTypeId>(selectedVehicle);
  const [badge, setBadge] = useState<DGTBadgeId>(selectedBadge);
  const [loading, setLoading] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);
  const [schedule, setSchedule] = useState<SERScheduleStatus | null>(null);
  const [tariff, setTariff] = useState<SERTariffResponse | null>(null);

  // Sincronizar estado inicial al abrir
  useEffect(() => {
    setCalle(initialCalle);
    setTipoPlaza(initialTipoPlaza);
    setVehicle(selectedVehicle);
    setBadge(selectedBadge);
    fetchCurrentSchedule().then(setSchedule).catch(() => {});
  }, [initialCalle, initialTipoPlaza, selectedVehicle, selectedBadge]);

  // Recalcular tarifa oficial al cambiar parámetros
  useEffect(() => {
    calculateTariff({
      tipo_plaza: tipoPlaza,
      minutos: duracionMinutos,
      tipo_vehiculo: vehicle,
      distintivo_dgt: badge
    }).then(setTariff).catch(() => {});
  }, [tipoPlaza, duracionMinutos, vehicle, badge]);

  const vehicleObj = VEHICLE_OPTIONS.find(v => v.id === vehicle);
  const badgeObj = BADGE_OPTIONS.find(b => b.id === badge);
  const isExempt = vehicleObj?.exento || badgeObj?.exento || (tariff && tariff.exento);

  // Cálculo inteligente: finPago = min(ahora + minutos, finHorarioSER)
  const startTime = new Date();
  const rawEndTime = new Date(startTime.getTime() + duracionMinutos * 60 * 1000);

  let adjustedEndTime = rawEndTime;
  let isLimitedBySER = false;

  if (schedule?.is_active && schedule.fin_horario_ser_today) {
    const finSer = new Date(schedule.fin_horario_ser_today);
    if (rawEndTime > finSer) {
      adjustedEndTime = finSer;
      isLimitedBySER = true;
    }
  }

  // Alerta 30 minutos antes del fin ajustado
  const alertTime = new Date(adjustedEndTime.getTime() - 30 * 60 * 1000);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let pushSub = null;
      if (pushEnabled) {
        pushSub = await subscribeToPushNotifications();
      }

      const parking = await createParking({
        calle,
        tipo_plaza: tipoPlaza,
        lat: coords.lat,
        lng: coords.lng,
        start_time: startTime.toISOString(),
        end_time: adjustedEndTime.toISOString(),
        tipo_vehiculo: vehicle,
        distintivo_dgt: badge,
        push_subscription: pushSub ? pushSub.toJSON() : undefined
      });

      onParkingCreated(parking);
      onClose();
    } catch (err) {
      console.error(err);
      alert('Error al registrar estacionamiento. Revisa la conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/60 backdrop-blur-sm animate-fade-in pointer-events-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100 flex flex-col max-h-[92vh]">
        {/* Cabecera */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-emerald-700 via-green-600 to-teal-700 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md text-lg">
              🚗
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold">Registrar Estacionamiento</h2>
              <p className="text-xs text-green-100">Simulador de parquímetro con aviso 30 min antes</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-4 overflow-y-auto text-xs text-gray-700">
          {/* Ubicación fijada */}
          <div className="p-3 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3">
            <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
            <div className="text-xs">
              <span className="text-gray-500 block text-[10px]">Coordenadas GPS</span>
              <span className="font-semibold text-gray-800">
                {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </span>
            </div>
          </div>

          {/* Calle / Referencia */}
          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
              Calle o Referencia del vehículo
            </label>
            <input
              type="text"
              value={calle}
              onChange={(e) => setCalle(e.target.value)}
              placeholder="Ej: Calle de Serrano 12"
              className="w-full px-3.5 py-2 bg-gray-50 border border-gray-200 rounded-xl text-xs sm:text-sm font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Tipo de Vehículo y Etiqueta DGT */}
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                Tipo de Vehículo
              </label>
              <select
                value={vehicle}
                onChange={(e) => setVehicle(e.target.value as VehicleTypeId)}
                className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {VEHICLE_OPTIONS.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.icono} {v.nombre}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-gray-700 uppercase tracking-wider mb-1">
                Distintivo DGT
              </label>
              <select
                value={badge}
                onChange={(e) => setBadge(e.target.value as DGTBadgeId)}
                className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-xl text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {BADGE_OPTIONS.map((b) => (
                  <option key={b.id} value={b.id}>
                    Etiqueta {b.nombre}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Tipo de Plaza */}
          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
              Tipo de Plaza SER
            </label>
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setTipoPlaza('VERDE');
                  if (duracionMinutos > 120 && !badgeObj?.sin_limite_tiempo) {
                    setDuracionMinutos(120);
                  }
                }}
                className={`p-2.5 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
                  tipoPlaza === 'VERDE'
                    ? 'border-green-500 bg-green-50 text-green-900 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="font-bold text-xs">Zona Verde</span>
                <span className="text-[10px] opacity-75">Máx. 2h no residentes</span>
              </button>

              <button
                type="button"
                onClick={() => { setTipoPlaza('AZUL'); }}
                className={`p-2.5 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
                  tipoPlaza === 'AZUL'
                    ? 'border-blue-500 bg-blue-50 text-blue-900 shadow-sm'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="font-bold text-xs">Zona Azul</span>
                <span className="text-[10px] opacity-75">Máx. 4h rotación</span>
              </button>
            </div>
          </div>

          {/* Rueda / Parquímetro Roller Interactivo */}
          <div>
            <label className="block text-[11px] font-bold text-gray-700 uppercase tracking-wider mb-1">
              Selector de Tiempo (Simulador de Parquímetro)
            </label>
            <ParquimetroRoller
              minutos={duracionMinutos}
              onChange={setDuracionMinutos}
              tipoPlaza={tipoPlaza}
              isExempt={!!isExempt}
              sinLimiteTiempo={badgeObj?.sin_limite_tiempo}
              precioTotal={tariff ? tariff.precio_total : 0.0}
              limitadoPorSER={isLimitedBySER}
              horaFinEstimada={adjustedEndTime}
            />
          </div>

          {/* Notificación Push */}
          <div className="p-3 bg-amber-50/70 rounded-2xl border border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bell className="w-4 h-4 text-amber-600 shrink-0" />
              <div className="text-xs">
                <span className="font-semibold text-amber-900 block text-[11px]">Aviso 30 minutos antes</span>
                <span className="text-amber-700 text-[10px]">
                  Alerta a las {alertTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} (visual y Web Push)
                </span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={pushEnabled}
              onChange={(e) => setPushEnabled(e.target.checked)}
              className="w-4 h-4 text-emerald-600 rounded cursor-pointer"
            />
          </div>

          {/* Botón de Enviar */}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50 text-xs sm:text-sm"
          >
            {loading ? 'Guardando...' : 'Confirmar Estacionamiento'}
          </button>
        </form>
      </div>
    </div>
  );
};
