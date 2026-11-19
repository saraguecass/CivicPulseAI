export interface SERProperties {
  id: number;
  cod_via?: number;
  nombre_calle: string;
  color: 'VERDE' | 'AZUL';
  tipo_reserva: string;
  num_plazas: number;
  distrito?: string;
  barrio?: string;
}

export interface SERGeoJSONFeature {
  type: 'Feature';
  geometry: {
    type: 'LineString';
    coordinates: number[][];
  };
  properties: SERProperties;
}

export interface SERGeoJSONFeatureCollection {
  type: 'FeatureCollection';
  features: SERGeoJSONFeature[];
}

export interface StreetSearchResult {
  nombre_calle: string;
  distrito: string;
  tipo_estacionamiento: 'VERDE' | 'AZUL' | 'MIXTO';
  total_plazas: number;
  plazas_verde: number;
  plazas_azul: number;
  center_coords: [number, number]; // [lng, lat]
}

export interface ActiveParking {
  id: number;
  user_id: string;
  calle?: string;
  tipo_plaza: 'VERDE' | 'AZUL';
  lat: number;
  lng: number;
  start_time: string;
  end_time: string;
  alert_time: string;
  notification_sent: boolean;
  created_at: string;
  minutos_restantes: number;
  limitado_por_ser?: boolean;
  explicacion_ajuste?: string;
}

export interface FilterState {
  showVerde: boolean;
  showAzul: boolean;
  distrito: string;
}

// --- Tipos para Normativa y Tarifas Oficiales SER Madrid ---
export type VehicleTypeId = 'turismo' | 'motocicleta' | 'ciclomotor' | 'triciclo' | 'furgoneta' | 'pmr' | 'taxi';
export type DGTBadgeId = 'CERO' | 'ECO' | 'C' | 'B' | 'A';

export interface VehicleTypeOption {
  id: VehicleTypeId;
  nombre: string;
  categoria: string;
  icono: string;
  exento_base: boolean;
  descripcion: string;
}

export interface DGTBadgeOption {
  id: DGTBadgeId;
  nombre: string;
  color_hex: string;
  reduccion_porcentaje: number;
  recargo_porcentaje: number;
  exento: boolean;
  sin_limite_tiempo?: boolean;
  restringido?: boolean;
  descripcion: string;
}

export interface SERScheduleStatus {
  is_active: boolean;
  ser_start: string | null;
  ser_end: string | null;
  fin_horario_ser_today: string | null;
  tipo_jornada: string;
  descripcion: string;
  minutos_restantes_ser_hoy: number;
}

export interface SERTariffResponse {
  precio_total: number;
  precio_base: number;
  exento: boolean;
  motivo_exencion: string | null;
  distintivo_dgt: string;
  factor_dgt_porcentaje?: number;
  factor_no2_porcentaje?: number;
  tipo_vehiculo: string;
  tipo_plaza: 'VERDE' | 'AZUL';
  minutos: number;
  max_minutos_zona?: number;
  restringido?: boolean;
  aviso_restriccion?: string | null;
  horario_info: string;
}

export interface SmartRouteData {
  origen: {
    nombre: string;
    coords: [number, number];
  };
  destino: {
    nombre: string;
    coords: [number, number];
  };
  parking: {
    nombre: string;
    color: 'VERDE' | 'AZUL';
    tipo_reserva: string;
    coords: [number, number];
    plazas_estimadas: number;
    distrito: string;
    barrio: string;
    tarifa: SERTariffResponse;
    horario_ser: SERScheduleStatus;
    periodo_ajustado: {
      start_time: string;
      end_time: string;
      alert_time: string;
      minutos_reales: number;
      limitado_por_ser: boolean;
      explicacion: string;
    };
  };
  tramos: {
    coche: {
      distancia_km: number;
      tiempo_min: number;
      coordinates: number[][];
      provider?: string;
    };
    pie: {
      distancia_m: number;
      tiempo_min: number;
      coordinates: number[][];
    };
  };
  resumen_viaje: {
    tiempo_total_min: number;
    distancia_total_km: number;
  };
}
