import { SERGeoJSONFeatureCollection, StreetSearchResult, ActiveParking } from '../types';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';
const API_BASE = `${API_URL.replace(/\/+$/, '')}/api`;
const ANONYMOUS_USER_ID_KEY = 'spotly-anonymous-user-id';

export function getAnonymousUserId(): string {
  let userId = localStorage.getItem(ANONYMOUS_USER_ID_KEY);
  if (!userId) {
    userId = crypto.randomUUID();
    localStorage.setItem(ANONYMOUS_USER_ID_KEY, userId);
  }
  return userId;
}

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
  user_id: string;
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

export async function fetchActiveParking(userId: string = getAnonymousUserId()): Promise<ActiveParking | null> {
  const res = await fetch(`${API_BASE}/estacionamientos/activo?user_id=${encodeURIComponent(userId)}`);
  if (!res.ok) return null;
  return res.json();
}

export async function endParking(parkingId: number, userId: string = getAnonymousUserId()): Promise<boolean> {
  const res = await fetch(`${API_BASE}/estacionamientos/${parkingId}?user_id=${encodeURIComponent(userId)}`, {
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
