import React, { useState } from 'react';
import { X, Clock, MapPin, Bell, ShieldCheck, Check } from 'lucide-react';
import { createParking, getAnonymousUserId } from '../services/api';
import { subscribeToPushNotifications } from '../services/notifications';
import { ActiveParking } from '../types';

interface ParkingModalProps {
  isOpen: boolean;
  onClose: () => void;
  coords: { lat: number; lng: number } | null;
  onParkingCreated: (parking: ActiveParking) => void;
}

export const ParkingModal: React.FC<ParkingModalProps> = ({
  isOpen,
  onClose,
  coords,
  onParkingCreated
}) => {
  if (!isOpen || !coords) return null;

  const [calle, setCalle] = useState('Zona SER Madrid');
  const [tipoPlaza, setTipoPlaza] = useState<'VERDE' | 'AZUL'>('VERDE');
  const [duracionMinutos, setDuracionMinutos] = useState<number>(120); // 2 horas por defecto
  const [loading, setLoading] = useState(false);
  const [pushEnabled, setPushEnabled] = useState(true);

  // Calcula hora fin estimada
  const startTime = new Date();
  const endTime = new Date(startTime.getTime() + duracionMinutos * 60 * 1000);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let pushSub = null;
      if (pushEnabled) {
        pushSub = await subscribeToPushNotifications();
      }

      const parking = await createParking({
        user_id: getAnonymousUserId(),
        calle,
        tipo_plaza: tipoPlaza,
        lat: coords.lat,
        lng: coords.lng,
        start_time: startTime.toISOString(),
        end_time: endTime.toISOString(),
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-3xl shadow-2xl max-w-md w-full overflow-hidden border border-gray-100">
        {/* Cabecera */}
        <div className="p-5 bg-gradient-to-r from-emerald-600 to-green-600 text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md">
              🚗
            </div>
            <div>
              <h2 className="text-lg font-bold">Registrar Estacionamiento</h2>
              <p className="text-xs text-green-100">Te avisaremos 30 min antes de que venza</p>
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
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Ubicación seleccionada */}
          <div className="p-3.5 bg-gray-50 rounded-2xl border border-gray-100 flex items-center gap-3">
            <MapPin className="w-5 h-5 text-emerald-600 shrink-0" />
            <div className="text-xs">
              <span className="text-gray-500 block">Ubicación fijada</span>
              <span className="font-semibold text-gray-800">
                {coords.lat.toFixed(5)}, {coords.lng.toFixed(5)}
              </span>
            </div>
          </div>

          {/* Nombre / Referencia de la calle */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Calle o Referencia
            </label>
            <input
              type="text"
              value={calle}
              onChange={(e) => setCalle(e.target.value)}
              placeholder="Ej: Calle de Serrano, frente al portal 12"
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
              required
            />
          </div>

          {/* Tipo de Plaza */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Tipo de Plaza SER
            </label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => { setTipoPlaza('VERDE'); setDuracionMinutos(120); }}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
                  tipoPlaza === 'VERDE'
                    ? 'border-green-500 bg-green-50 text-green-800'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="font-bold text-sm">Zona Verde</span>
                <span className="text-xs opacity-75">Máx. 2 horas</span>
              </button>

              <button
                type="button"
                onClick={() => { setTipoPlaza('AZUL'); setDuracionMinutos(240); }}
                className={`p-3 rounded-2xl border-2 flex flex-col items-center justify-center transition-all ${
                  tipoPlaza === 'AZUL'
                    ? 'border-blue-500 bg-blue-50 text-blue-800'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                <span className="font-bold text-sm">Zona Azul</span>
                <span className="text-xs opacity-75">Máx. 4 horas</span>
              </button>
            </div>
          </div>

          {/* Selector de Duración */}
          <div>
            <label className="block text-xs font-semibold text-gray-700 uppercase tracking-wider mb-1.5">
              Duración del estacionamiento
            </label>
            <div className="grid grid-cols-4 gap-2">
              {[30, 60, 90, 120, 180, 240].map((min) => {
                if (tipoPlaza === 'VERDE' && min > 120) return null;
                return (
                  <button
                    key={min}
                    type="button"
                    onClick={() => setDuracionMinutos(min)}
                    className={`py-2 text-xs font-semibold rounded-xl border transition-all ${
                      duracionMinutos === min
                        ? 'bg-gray-900 text-white border-gray-900'
                        : 'bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100'
                    }`}
                  >
                    {min < 60 ? `${min}m` : `${min / 60}h`}
                  </button>
                );
              })}
            </div>
            <p className="mt-2 text-xs text-gray-500 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-gray-400" />
              Finaliza a las <strong>{endTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</strong>
            </p>
          </div>

          {/* Opción de Notificación Push */}
          <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Bell className="w-4 h-4 text-amber-600" />
              <div className="text-xs">
                <span className="font-semibold text-amber-900 block">Aviso a 30 minutos</span>
                <span className="text-amber-700">Notificación al móvil</span>
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
            className="w-full py-3.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-2xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2 disabled:opacity-50"
          >
            {loading ? 'Guardando...' : 'Confirmar Estacionamiento'}
          </button>
        </form>
      </div>
    </div>
  );
};
