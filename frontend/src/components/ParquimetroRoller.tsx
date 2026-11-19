import React from 'react';
import { Plus, Minus, Clock, AlertTriangle, ShieldCheck, Sparkles, ChevronUp, ChevronDown } from 'lucide-react';

interface ParquimetroRollerProps {
  minutos: number;
  onChange: (nuevoMinutos: number) => void;
  tipoPlaza: 'VERDE' | 'AZUL';
  isExempt?: boolean;
  sinLimiteTiempo?: boolean;
  precioTotal?: number;
  limitadoPorSER?: boolean;
  horaFinEstimada?: Date;
}

export const ParquimetroRoller: React.FC<ParquimetroRollerProps> = ({
  minutos,
  onChange,
  tipoPlaza,
  isExempt = false,
  sinLimiteTiempo = false,
  precioTotal = 0.0,
  limitadoPorSER = false,
  horaFinEstimada
}) => {
  const minPermitido = 20; // 20 min mínimo legal en el SER de Madrid
  const maxPermitido = sinLimiteTiempo
    ? 240
    : tipoPlaza === 'VERDE'
      ? 120 // 2 horas max en Verde para no residentes
      : 240; // 4 horas max en Azul

  const handleStep = (delta: number) => {
    const nuevo = Math.min(maxPermitido, Math.max(minPermitido, minutos + delta));
    onChange(nuevo);
  };

  const horas = Math.floor(minutos / 60);
  const minsRestantes = minutos % 60;
  const textoTiempo = horas > 0
    ? `${horas}h ${minsRestantes > 0 ? `${minsRestantes}m` : '00m'}`
    : `${minutos} min`;

  const isAtMin = minutos <= minPermitido;
  const isAtMax = minutos >= maxPermitido;

  return (
    <div className="bg-gradient-to-b from-gray-900 via-gray-800 to-black text-white p-4 rounded-3xl border-2 border-gray-700 shadow-2xl space-y-3 font-sans">
      {/* Cabecera estilo parquímetro municipal */}
      <div className="flex items-center justify-between border-b border-gray-700 pb-2">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-mono tracking-wider uppercase text-gray-300">
            PARQUÍMETRO SER MADRID
          </span>
        </div>
        <span
          className={`text-[10px] font-black px-2 py-0.5 rounded-full border ${
            tipoPlaza === 'VERDE'
              ? 'bg-green-950 text-green-300 border-green-500'
              : 'bg-blue-950 text-blue-300 border-blue-500'
          }`}
        >
          {tipoPlaza === 'VERDE' ? 'ZONA VERDE (MÁX 2H)' : 'ZONA AZUL (MÁX 4H)'}
        </span>
      </div>

      {/* Pantalla LCD Digital Central */}
      <div className="bg-black/90 p-4 rounded-2xl border border-gray-700 shadow-inner flex flex-col items-center justify-center relative overflow-hidden">
        {/* Efecto scanline retro */}
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-emerald-500/5 to-transparent pointer-events-none" />

        <span className="text-[10px] text-emerald-400/80 font-mono tracking-widest uppercase mb-1">
          TIEMPO SELECCIONADO
        </span>

        {/* Display grande de tiempo */}
        <div className="flex items-center gap-2">
          <span className="font-mono text-3xl sm:text-4xl font-black text-emerald-400 tracking-tight drop-shadow-[0_0_10px_rgba(52,211,153,0.5)]">
            {textoTiempo}
          </span>
          <span className="text-xs text-gray-400 font-mono">({minutos} min)</span>
        </div>

        {/* Importe a pagar en el parquímetro */}
        <div className="mt-2 pt-2 border-t border-gray-800 w-full flex items-center justify-between text-xs px-2">
          <span className="text-gray-400 font-medium">Importe tique:</span>
          <span className="font-mono font-black text-sm text-yellow-300">
            {isExempt ? '0,00 € (EXENTO)' : `${precioTotal.toFixed(2)} €`}
          </span>
        </div>

        {/* Hora de fin calculada */}
        {horaFinEstimada && (
          <div className="mt-1 text-[11px] text-gray-400 flex items-center gap-1">
            <Clock className="w-3 h-3 text-emerald-400" />
            <span>Válido hasta:</span>
            <strong className="text-white font-mono">
              {horaFinEstimada.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </strong>
          </div>
        )}
      </div>

      {/* Aviso de límite de SER si aplica */}
      {limitadoPorSER && (
        <div className="p-2 bg-amber-950/70 border border-amber-600/50 rounded-xl text-amber-200 text-[11px] flex items-center gap-1.5">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
          <span>Hora ajustada automáticamente al fin del horario SER (21:00 o 15:00).</span>
        </div>
      )}

      {/* Rueda / Controles de sumar y restar minutos (como parquímetro físico) */}
      <div className="space-y-2 pt-1">
        <div className="flex items-center justify-between gap-2">
          {/* Botones de restar */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={isAtMin}
              onClick={() => handleStep(-15)}
              className="px-2.5 py-2 bg-gray-800 hover:bg-gray-700 active:bg-gray-900 disabled:opacity-30 disabled:hover:bg-gray-800 text-white rounded-xl font-bold text-xs border border-gray-600 transition-all flex items-center gap-0.5"
              title="Restar 15 minutos"
            >
              <Minus className="w-3 h-3" /> 15m
            </button>
            <button
              type="button"
              disabled={isAtMin}
              onClick={() => handleStep(-5)}
              className="px-2.5 py-2 bg-gray-800 hover:bg-gray-700 active:bg-gray-900 disabled:opacity-30 disabled:hover:bg-gray-800 text-white rounded-xl font-bold text-xs border border-gray-600 transition-all flex items-center gap-0.5"
              title="Restar 5 minutos"
            >
              <Minus className="w-3 h-3" /> 5m
            </button>
          </div>

          {/* Rango deslizante / visual slider */}
          <div className="flex-1 px-1">
            <input
              type="range"
              min={minPermitido}
              max={maxPermitido}
              step={5}
              value={minutos}
              onChange={(e) => onChange(Number(e.target.value))}
              className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          {/* Botones de sumar */}
          <div className="flex items-center gap-1">
            <button
              type="button"
              disabled={isAtMax}
              onClick={() => handleStep(5)}
              className="px-2.5 py-2 bg-gray-800 hover:bg-gray-700 active:bg-gray-900 disabled:opacity-30 disabled:hover:bg-gray-800 text-white rounded-xl font-bold text-xs border border-gray-600 transition-all flex items-center gap-0.5"
              title="Sumar 5 minutos"
            >
              <Plus className="w-3 h-3" /> 5m
            </button>
            <button
              type="button"
              disabled={isAtMax}
              onClick={() => handleStep(15)}
              className="px-2.5 py-2 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 disabled:opacity-30 disabled:hover:bg-emerald-600 text-white rounded-xl font-bold text-xs border border-emerald-400 transition-all flex items-center gap-0.5 shadow-md shadow-emerald-900/30"
              title="Sumar 15 minutos"
            >
              <Plus className="w-3 h-3" /> 15m
            </button>
          </div>
        </div>

        {/* Botones rápidos de hora */}
        <div className="grid grid-cols-4 gap-1.5 text-[10px] pt-1">
          {[30, 60, 120, 240].map((t) => {
            if (t > maxPermitido) return null;
            return (
              <button
                key={t}
                type="button"
                onClick={() => onChange(t)}
                className={`py-1 rounded-lg border font-mono font-bold transition-all ${
                  minutos === t
                    ? 'bg-emerald-500 text-black border-emerald-300 shadow-sm'
                    : 'bg-gray-800/80 hover:bg-gray-700 text-gray-300 border-gray-700'
                }`}
              >
                {t < 60 ? `${t}m` : `${t / 60}h`}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
};
