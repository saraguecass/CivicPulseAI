import React, { useState } from 'react';
import { X, Check, ShieldCheck, AlertCircle, Info, Sparkles } from 'lucide-react';
import { VehicleTypeId, DGTBadgeId } from '../types';

interface VehicleSelectorModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedVehicle: VehicleTypeId;
  selectedBadge: DGTBadgeId;
  onSave: (vehicle: VehicleTypeId, badge: DGTBadgeId) => void;
}

export const VEHICLE_OPTIONS: { id: VehicleTypeId; nombre: string; icono: string; exento: boolean; desc: string }[] = [
  { id: 'turismo', nombre: 'Turismo / Coche', icono: '🚗', exento: false, desc: 'Automóvil particular estándar (M1)' },
  { id: 'motocicleta', nombre: 'Motocicleta (2 ruedas)', icono: '🏍️', exento: true, desc: 'Exento de pago en todo el SER' },
  { id: 'ciclomotor', nombre: 'Ciclomotor (2 ruedas)', icono: '🛵', exento: true, desc: 'Hasta 50cc o eléctrico (Exento de pago)' },
  { id: 'triciclo', nombre: 'Vehículo 3 ruedas', icono: '🛺', exento: true, desc: 'Tres ruedas simétricas (Exento de pago)' },
  { id: 'furgoneta', nombre: 'Furgoneta / Mixto', icono: '🚐', exento: false, desc: 'Comercial ligero hasta 3.500 kg' },
  { id: 'pmr', nombre: 'Vehículo PMR', icono: '♿', exento: true, desc: 'Movilidad Reducida con tarjeta oficial (Exento)' },
  { id: 'taxi', nombre: 'Taxi en servicio', icono: '🚕', exento: true, desc: 'Servicio público con conductor presente (Exento)' }
];

export const BADGE_OPTIONS: { id: DGTBadgeId; nombre: string; color: string; bg: string; border: string; desc: string; exento: boolean; sin_limite_tiempo?: boolean }[] = [
  { id: 'CERO', nombre: '0 Emisiones', color: 'text-sky-800', bg: 'bg-sky-50', border: 'border-sky-400', desc: '100% Reducción (0€) y sin límite horario', exento: true, sin_limite_tiempo: true },
  { id: 'ECO', nombre: 'ECO', color: 'text-emerald-800', bg: 'bg-emerald-50', border: 'border-emerald-400', desc: '75% de bonificación sobre tarifa base', exento: false, sin_limite_tiempo: false },
  { id: 'C', nombre: 'Distintivo C', color: 'text-green-800', bg: 'bg-green-50', border: 'border-green-400', desc: 'Tarifa base ordinaria (0% variación)', exento: false, sin_limite_tiempo: false },
  { id: 'B', nombre: 'Distintivo B', color: 'text-amber-800', bg: 'bg-amber-50', border: 'border-amber-400', desc: '+20% recargo sobre tarifa base', exento: false, sin_limite_tiempo: false },
  { id: 'A', nombre: 'Sin distintivo (A)', color: 'text-gray-800', bg: 'bg-gray-100', border: 'border-gray-400', desc: 'Restringido: prohibido a no residentes en SER', exento: false, sin_limite_tiempo: false }
];

export const VehicleSelectorModal: React.FC<VehicleSelectorModalProps> = ({
  isOpen,
  onClose,
  selectedVehicle,
  selectedBadge,
  onSave
}) => {
  const [vehicle, setVehicle] = useState<VehicleTypeId>(selectedVehicle);
  const [badge, setBadge] = useState<DGTBadgeId>(selectedBadge);

  if (!isOpen) return null;

  const currentVehicleObj = VEHICLE_OPTIONS.find(v => v.id === vehicle);
  const currentBadgeObj = BADGE_OPTIONS.find(b => b.id === badge);
  const isExempt = currentVehicleObj?.exento || currentBadgeObj?.exento;

  const handleApply = () => {
    onSave(vehicle, badge);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in pointer-events-auto">
      <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-100 flex flex-col max-h-[90vh]">
        {/* Cabecera */}
        <div className="p-5 bg-gradient-to-r from-emerald-700 to-green-600 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-md text-xl">
              🚗
            </div>
            <div>
              <h3 className="font-bold text-base">Mi Vehículo y Distintivo DGT</h3>
              <p className="text-xs text-green-100">Cálculo de tarifas oficiales y exenciones SER</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Cuerpo */}
        <div className="p-6 space-y-5 overflow-y-auto">
          {/* Banner de estado de Exención */}
          {isExempt ? (
            <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-start gap-3">
              <Sparkles className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
              <div className="text-xs text-emerald-900">
                <strong className="block font-bold text-sm text-emerald-800">
                  🎉 ¡Vehículo Exento de Pago en el SER!
                </strong>
                <span>
                  {currentVehicleObj?.exento
                    ? `${currentVehicleObj.nombre} está exento de pago según la ordenanza municipal (dos/tres ruedas, PMR o taxi). No requiere tique.`
                    : 'Con distintivo CERO Emisiones estacionas gratis en zonas Verde y Azul sin límite horario.'}
                </span>
              </div>
            </div>
          ) : badge === 'A' ? (
            <div className="p-4 bg-red-50 rounded-2xl border border-red-200 flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
              <div className="text-xs text-red-900">
                <strong className="block font-bold text-sm text-red-800">
                  ⚠️ Restricción de Estacionamiento
                </strong>
                <span>
                  Los vehículos sin distintivo ambiental (Categoría A) tienen prohibido el estacionamiento en plazas del SER para no residentes.
                </span>
              </div>
            </div>
          ) : badge === 'ECO' ? (
            <div className="p-3 bg-emerald-50 rounded-2xl border border-emerald-200 flex items-center gap-2.5 text-xs text-emerald-900">
              <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
              <span><strong>Bonificación ECO:</strong> Ahorras un <strong>75%</strong> en la tarifa de los parquímetros.</span>
            </div>
          ) : badge === 'B' ? (
            <div className="p-3 bg-amber-50 rounded-2xl border border-amber-200 flex items-center gap-2.5 text-xs text-amber-900">
              <Info className="w-4 h-4 text-amber-600 shrink-0" />
              <span><strong>Recargo Distintivo B:</strong> +20% sobre la tarifa base de la sede municipal.</span>
            </div>
          ) : null}

          {/* 1. Selector de Tipo de Vehículo */}
          <div>
            <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
              1. Tipo de Vehículo (Tipología oficial DGT)
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {VEHICLE_OPTIONS.map((item) => {
                const isSelected = vehicle === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setVehicle(item.id)}
                    className={`p-3 rounded-2xl border text-left flex items-center gap-3 transition-all ${
                      isSelected
                        ? 'border-emerald-600 bg-emerald-50/70 shadow-sm ring-1 ring-emerald-600'
                        : 'border-gray-200 hover:bg-gray-50 bg-white'
                    }`}
                  >
                    <span className="text-2xl">{item.icono}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-1">
                        <span className="font-bold text-xs text-gray-900 truncate">{item.nombre}</span>
                        {item.exento && (
                          <span className="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-1.5 py-0.5 rounded-full shrink-0">
                            Exento
                          </span>
                        )}
                      </div>
                      <span className="text-[11px] text-gray-500 block truncate">{item.desc}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* 2. Selector de Distintivo Ambiental DGT */}
          <div>
            <label className="block text-xs font-bold text-gray-800 uppercase tracking-wider mb-2">
              2. Distintivo Ambiental DGT (Pegatina)
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {BADGE_OPTIONS.map((item) => {
                const isSelected = badge === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setBadge(item.id)}
                    className={`p-3 rounded-2xl border text-left transition-all ${item.bg} ${
                      isSelected
                        ? `ring-2 ring-gray-900 shadow-md ${item.border}`
                        : 'border-gray-200 opacity-80 hover:opacity-100'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className={`font-black text-xs ${item.color}`}>{item.nombre}</span>
                      {isSelected && <Check className="w-4 h-4 text-gray-900" />}
                    </div>
                    <span className="text-[10px] text-gray-600 block line-clamp-2 leading-tight">
                      {item.desc}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Pie de modal */}
        <div className="p-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between shrink-0">
          <span className="text-xs text-gray-500">
            Preferencia guardada para rutas y estacionamientos
          </span>
          <button
            type="button"
            onClick={handleApply}
            className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-md transition-all active:scale-95"
          >
            Guardar y Aplicar
          </button>
        </div>
      </div>
    </div>
  );
};
