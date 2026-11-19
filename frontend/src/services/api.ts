import {
  SERGeoJSONFeatureCollection,
  StreetSearchResult,
  ActiveParking,
  SERScheduleStatus,
  SERTariffResponse,
  SmartRouteData,
  VehicleTypeId,
  DGTBadgeId
} from '../types';

const API_BASE = '/api';

export async function fetchZonas(params?: {
  color?: string;
  distrito?: string;
  bbox?: string;
}): Promise<SERGeoJSONFeatureCollection> {
  const query = new URLSearchParams();
  if (params?.color) query.append('color', params.color);
  if (params?.distrito) query.append('distrito', params.distrito);
  if (params?.bbox) query.append('bbox', params.bbox);

  const res = await fetch(`${API_BASE}/zonas?${query.toString()}`);
  if (!res.ok) throw new Error('Error al cargar zonas SER');
  return res.json();
}

export async function searchCalles(q: string): Promise<StreetSearchResult[]> {
  if (!q || q.trim().length < 2) return [];
  const res = await fetch(`${API_BASE}/calles/buscar?q=${encodeURIComponent(q.trim())}`);
  if (!res.ok) throw new Error('Error buscando calles');
  return res.json();
}

export async function createParking(data: {
  calle: string;
  tipo_plaza: 'VERDE' | 'AZUL';
  lat: number;
  lng: number;
  start_time: string;
  end_time: string;
  tipo_vehiculo?: string;
  distintivo_dgt?: string;
  user_id?: string;
  push_subscription?: any;
}): Promise<ActiveParking> {
  const res = await fetch(`${API_BASE}/estacionamientos`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  });
  if (!res.ok) throw new Error('Error al guardar estacionamiento');
  return res.json();
}

export async function fetchActiveParking(userId: string = 'anon-user'): Promise<ActiveParking | null> {
  const res = await fetch(`${API_BASE}/estacionamientos/activo?user_id=${encodeURIComponent(userId)}`);
  if (!res.ok) return null;
  return res.json();
}

export async function endParking(parkingId: number): Promise<boolean> {
  const res = await fetch(`${API_BASE}/estacionamientos/${parkingId}`, {
    method: 'DELETE'
  });
  return res.ok;
}

export async function getVapidPublicKey(): Promise<string> {
  try {
    const res = await fetch(`${API_BASE}/estacionamientos/vapid-public-key`);
    if (!res.ok) return '';
    const data = await res.json();
    return data.publicKey || '';
  } catch {
    return '';
  }
}

// --- Endpoints de Normativa SER, Tarifas y Rutas Multimodales ---

export async function fetchSERInfo(): Promise<any> {
  const res = await fetch(`${API_BASE}/ser/info`);
  if (!res.ok) throw new Error('Error obteniendo información de tarifas SER');
  return res.json();
}

export async function fetchCurrentSchedule(): Promise<SERScheduleStatus> {
  const res = await fetch(`${API_BASE}/ser/estado-horario`);
  if (!res.ok) throw new Error('Error consultando horario SER');
  return res.json();
}

export async function calculateTariff(params: {
  tipo_plaza: 'VERDE' | 'AZUL';
  minutos: number;
  tipo_vehiculo: VehicleTypeId;
  distintivo_dgt: DGTBadgeId;
  episodio_no2?: string;
}): Promise<SERTariffResponse> {
  const res = await fetch(`${API_BASE}/ser/calcular-tarifa`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) throw new Error('Error al calcular tarifa');
  return res.json();
}

export async function planSmartRoute(params: {
  origen: any;
  destino: any;
  tipo_vehiculo: VehicleTypeId;
  distintivo_dgt: DGTBadgeId;
  duracion_minutos: number;
  episodio_no2?: string;
}): Promise<SmartRouteData> {
  const res = await fetch(`${API_BASE}/rutas/planificar`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    const errorData = await res.json().catch(() => ({}));
    throw new Error(errorData.detail || 'Error al planificar ruta con parada en parking');
  }
  return res.json();
}

export async function fetchGeocodingAutocomplete(q: string): Promise<Array<{
  label: string;
  lat: number;
  lng: number;
  tipo: string;
  distrito?: string;
}>> {
  if (!q || q.trim().length < 1) return [];
  const res = await fetch(`${API_BASE}/geocoding/autocomplete?q=${encodeURIComponent(q.trim())}&limit=5`);
  if (!res.ok) return [];
  return res.json();
}
