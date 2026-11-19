import React, { useState, useEffect } from 'react';
import { Clock, ExternalLink, X, AlertTriangle, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { SERScheduleStatus } from '../types';
import { fetchCurrentSchedule } from '../services/api';

export const ScheduleStatusPill: React.FC = () => {
  const [schedule, setSchedule] = useState<SERScheduleStatus | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    fetchCurrentSchedule()
      .then(setSchedule)
      .catch((err) => console.error('Error cargando horario SER:', err));

    const interval = setInterval(() => {
      fetchCurrentSchedule().then(setSchedule).catch(() => {});
    }, 60000); // Actualiza cada minuto

    return () => clearInterval(interval);
  }, []);

  if (!schedule) return null;

  return (
    <>
      {/* Botón / Pill flotante en la cabecera */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 bg-white/95 backdrop-blur-md rounded-xl shadow-md border border-gray-200 hover:bg-gray-50 transition-all text-xs font-medium text-gray-800 pointer-events-auto"
        title="Consultar horarios y normativa oficial SER Madrid"
      >
        <span
          className={`w-2.5 h-2.5 rounded-full shrink-0 ${
            schedule.is_active
              ? schedule.tipo_jornada === 'REDUCIDA_15H'
                ? 'bg-amber-500 animate-pulse'
                : 'bg-emerald-500'
              : 'bg-gray-400'
          }`}
        />
        <div className="flex items-center gap-1.5">
          <span className="font-bold">
            {schedule.is_active
              ? `SER Activo (hasta ${schedule.ser_end})`
              : 'SER Gratuito / Fuera de horario'}
          </span>
          <Clock className="w-3.5 h-3.5 text-gray-400" />
        </div>
      </button>

      {/* Modal / Desplegable con normativa oficial y enlaces */}
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in pointer-events-auto">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full overflow-hidden border border-gray-200">
            {/* Cabecera */}
            <div className="p-5 bg-gradient-to-r from-gray-900 to-gray-800 text-white flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="p-2 bg-white/10 rounded-xl">
                  <Clock className="w-5 h-5 text-emerald-400" />
                </div>
                <div>
                  <h3 className="font-bold text-base">Horarios y Normativa SER Madrid</h3>
                  <p className="text-xs text-gray-300">Fuentes oficiales del Ayuntamiento y Ordenanzas</p>
                </div>
              </div>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-full hover:bg-white/20 transition-colors"
              >
                <X className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Contenido */}
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto text-xs text-gray-700">
              {/* Estado hoy */}
              <div
                className={`p-4 rounded-2xl border flex items-start gap-3 ${
                  schedule.is_active
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                    : 'bg-gray-50 border-gray-200 text-gray-800'
                }`}
              >
                <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-bold text-sm mb-0.5">Estado actual del servicio</h4>
                  <p className="text-xs opacity-90">{schedule.descripcion}</p>
                </div>
              </div>

              {/* Horarios Oficiales */}
              <div className="space-y-2">
                <h4 className="font-bold text-gray-900 text-sm">📅 Horarios Regulados Oficiales</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="font-bold block text-gray-800">Lunes a Viernes</span>
                    <span className="text-gray-600">09:00 a 21:00 h ininterrumpido</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="font-bold block text-gray-800">Sábados</span>
                    <span className="text-gray-600">09:00 a 15:00 h</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="font-bold block text-gray-800">Mes de Agosto</span>
                    <span className="text-gray-600">09:00 a 15:00 h (L-S)</span>
                  </div>
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    <span className="font-bold block text-gray-800">24 y 31 de Diciembre</span>
                    <span className="text-gray-600">09:00 a 15:00 h</span>
                  </div>
                </div>
                <div className="p-3 bg-green-50 rounded-xl border border-green-200 text-green-900">
                  <strong>🎉 Domingos y festivos:</strong> Sin servicio todo el día (estacionamiento gratuito en toda la red SER).
                </div>
              </div>

              {/* Duración Máxima */}
              <div className="space-y-2">
                <h4 className="font-bold text-gray-900 text-sm">⏱️ Duración Máxima Permitida</h4>
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900">
                    <strong className="block text-blue-800">Zona Azul</strong>
                    <span>Máximo <strong>4 horas</strong> consecutivas para rotación.</span>
                  </div>
                  <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-900">
                    <strong className="block text-green-800">Zona Verde</strong>
                    <span>Máximo <strong>2 horas</strong> para no residentes (residentes sin límite).</span>
                  </div>
                </div>
              </div>

              {/* Vehículos no sujetos al pago */}
              <div className="p-3.5 bg-amber-50 rounded-2xl border border-amber-200">
                <h4 className="font-bold text-amber-900 text-sm mb-1 flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-amber-700" />
                  Vehículos Exentos de Pago
                </h4>
                <ul className="list-disc list-inside space-y-1 text-amber-800 text-[11px]">
                  <li>Vehículos de dos y tres ruedas (motocicletas y ciclomotores).</li>
                  <li>Distintivo ambiental <strong>"0 Emisiones"</strong> de la DGT (100% gratuito sin límite).</li>
                  <li>Vehículos destinados al transporte de Personas con Movilidad Reducida (PMR con tarjeta).</li>
                  <li>Autotaxis y Eurotaxis en servicio con conductor presente.</li>
                  <li>Servicios de urgencia y emergencias debidamente rotulados.</li>
                </ul>
              </div>

              {/* Fuentes Oficiales */}
              <div className="pt-2 border-t border-gray-100 space-y-1.5">
                <span className="font-bold text-gray-800 block text-xs">🔗 Fuentes y Sede Municipal:</span>
                <div className="space-y-1">
                  <a
                    href="https://www.madrid.es/portales/munimadrid/es/Inicio/Movilidad-y-transportes/Servicio-de-Estacionamiento-Regulado-SER-Tarifas-y-vehiculos-no-sujetos-al-pago/?vgnextfmt=default&vgnextoid=972be4ce78dd6410VgnVCM1000000b205a0aRCRD&vgnextchannel=220e31d3b28fe410VgnVCM1000000b205a0aRCRD"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-blue-700 font-medium"
                  >
                    <span>Ayuntamiento de Madrid: Tarifas y vehículos exentos</span>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                  </a>
                  <a
                    href="https://www.madrid.es/portales/munimadrid/es/Inicio/Movilidad-y-transportes/Servicio-de-Estacionamiento-Regulado-SER-Horario-delimitacion-territorial-y-ambitos-diferenciados-/?vgnextfmt=default&vgnextoid=6f18e4ce78dd6410VgnVCM1000000b205a0aRCRD&vgnextchannel=220e31d3b28fe410VgnVCM1000000b205a0aRCRD"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-blue-700 font-medium"
                  >
                    <span>Ayuntamiento de Madrid: Horarios y delimitación</span>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                  </a>
                  <a
                    href="https://www.motor.mapfre.es/consejos-practicos/seguridad-vial/tarifas-y-horarios-de-la-zona-azul-madrid/"
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-blue-700 font-medium"
                  >
                    <span>Motor Mapfre: Guía de tarifas y horarios zona azul</span>
                    <ExternalLink className="w-3.5 h-3.5 text-gray-500" />
                  </a>
                </div>
              </div>
            </div>

            <div className="p-4 bg-gray-50 border-t border-gray-100 flex justify-end">
              <button
                onClick={() => setIsOpen(false)}
                className="px-5 py-2 bg-gray-900 text-white rounded-xl font-bold text-xs hover:bg-black transition-colors"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
