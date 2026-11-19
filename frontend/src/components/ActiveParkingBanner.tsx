import React, { useState, useEffect } from 'react';
import { Clock, AlertTriangle, Calendar, X, Navigation } from 'lucide-react';
import { ActiveParking } from '../types';
import { endParking } from '../services/api';

interface ActiveParkingBannerProps {
  parking: ActiveParking;
  onParkingEnded: () => void;
  onCenterOnCar: (coords: [number, number]) => void;
}

export const ActiveParkingBanner: React.FC<ActiveParkingBannerProps> = ({
  parking,
  onParkingEnded,
  onCenterOnCar
}) => {
  const [timeLeftSeconds, setTimeLeftSeconds] = useState<number>(0);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const calculateTime = () => {
      const now = new Date().getTime();
      const end = new Date(parking.end_time).getTime();
      const diffSecs = Math.max(0, Math.floor((end - now) / 1000));
      setTimeLeftSeconds(diffSecs);
    };

    calculateTime();
    const interval = setInterval(calculateTime, 1000);
    return () => clearInterval(interval);
  }, [parking.end_time]);

  const hours = Math.floor(timeLeftSeconds / 3600);
  const minutes = Math.floor((timeLeftSeconds % 3600) / 60);
  const seconds = timeLeftSeconds % 60;
  const isCritical = timeLeftSeconds > 0 && timeLeftSeconds <= 30 * 60; // Menos de 30 minutos
  const isExpired = timeLeftSeconds === 0;

  const handleEndParking = async () => {
    if (!confirm('¿Has retirado el coche? Esto finalizará el aviso.')) return;
    setLoading(true);
    try {
      await endParking(parking.id);
      onParkingEnded();
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Enlace directo para añadir recordatorio a Google Calendar
  const getGoogleCalendarUrl = () => {
    const startIso = new Date(parking.start_time).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const endIso = new Date(parking.end_time).toISOString().replace(/-|:|\.\d\d\d/g, '');
    const title = encodeURIComponent(`Fin de Estacionamiento SER (${parking.calle || 'Madrid'})`);
    const details = encodeURIComponent(`Estacionamiento en zona ${parking.tipo_plaza}. Recuerda retirar o renovar tu vehículo.`);
    const location = encodeURIComponent(parking.calle || `${parking.lat},${parking.lng}`);
    return `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${startIso}/${endIso}&details=${details}&location=${location}`;
  };

  return (
    <div
      className={`rounded-2xl shadow-xl border p-4 backdrop-blur-md transition-all ${
        isCritical
          ? 'bg-red-500/95 text-white border-red-600 animate-pulse'
          : isExpired
          ? 'bg-gray-800 text-white border-gray-900'
          : 'bg-white/95 text-gray-900 border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div
            className={`p-2.5 rounded-xl ${
              isCritical
                ? 'bg-white text-red-600'
                : 'bg-emerald-100 text-emerald-800'
            }`}
          >
            {isCritical ? <AlertTriangle className="w-5 h-5" /> : <Clock className="w-5 h-5" />}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">
                {isExpired ? 'Estacionamiento Finalizado' : isCritical ? '¡Aviso! Menos de 30 min' : 'Estacionamiento Activo'}
              </span>
              <span
                className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                  parking.tipo_plaza === 'VERDE' ? 'bg-green-100 text-green-800' : 'bg-blue-100 text-blue-800'
                }`}
              >
                {parking.tipo_plaza}
              </span>
            </div>
            <p className="text-xs opacity-80 mt-0.5">{parking.calle || 'Madrid'}</p>
          </div>
        </div>

        {/* Cuenta atrás */}
        <div className="text-right">
          <div className="font-mono font-bold text-lg leading-tight">
            {hours > 0 ? `${hours}h ` : ''}
            {String(minutes).padStart(2, '0')}:{String(seconds).padStart(2, '0')}
          </div>
          <span className="text-[10px] opacity-75 uppercase tracking-wider block">Tiempo restante</span>
        </div>
      </div>

      {/* Botones de acción rápida */}
      <div className="mt-3.5 pt-3 border-t border-current/10 flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          {/* Centrar mapa en el coche */}
          <button
            onClick={() => onCenterOnCar([parking.lng, parking.lat])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/10 hover:bg-black/20 text-xs font-semibold transition-colors"
          >
            <Navigation className="w-3.5 h-3.5" />
            Ver mi coche
          </button>

          {/* Añadir a Google Calendar */}
          <a
            href={getGoogleCalendarUrl()}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/10 hover:bg-black/20 text-xs font-semibold transition-colors"
          >
            <Calendar className="w-3.5 h-3.5" />
            Añadir a Calendar
          </a>
        </div>

        {/* Liberar plaza */}
        <button
          onClick={handleEndParking}
          disabled={loading}
          className="px-3 py-1.5 rounded-xl bg-black/10 hover:bg-black/20 text-xs font-bold transition-colors ml-auto"
        >
          {loading ? 'Finalizando...' : 'Liberar plaza'}
        </button>
      </div>
    </div>
  );
};
