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
}

export interface FilterState {
  showVerde: boolean;
  showAzul: boolean;
  distrito: string;
}
