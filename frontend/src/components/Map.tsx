import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { SERGeoJSONFeatureCollection, ActiveParking, FilterState } from '../types';

interface MapProps {
  geojsonData: SERGeoJSONFeatureCollection | null;
  filters: FilterState;
  activeParking: ActiveParking | null;
  onSelectLocation?: (coords: { lat: number; lng: number }) => void;
  flyToCoords?: [number, number] | null;
}

export const Map: React.FC<MapProps> = ({
  geojsonData,
  filters,
  activeParking,
  onSelectLocation,
  flyToCoords
}) => {
  const mapContainer = useRef<HTMLDivElement>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const parkingMarker = useRef<maplibregl.Marker | null>(null);

  useEffect(() => {
    if (!mapContainer.current || map.current) return;

    // Inicializar mapa centrado en el corazón del SER de Madrid
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [-3.688, 40.428], // Zona Salamanca / Chamberí
      zoom: 14,
      maxZoom: 19,
      minZoom: 11
    });

    // Controles de navegación y geolocalización nativa
    map.current.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'bottom-right');
    const geolocate = new maplibregl.GeolocateControl({
      positionOptions: { enableHighAccuracy: true },
      trackUserLocation: true
    });
    map.current.addControl(geolocate, 'bottom-right');

    map.current.on('load', () => {
      if (!map.current) return;

      // Fuente de datos GeoJSON para las calles SER
      map.current.addSource('ser-streets', {
        type: 'geojson',
        data: geojsonData || { type: 'FeatureCollection', features: [] }
      });

      // Capa de fondo para efecto "glow" o contorno
      map.current.addLayer({
        id: 'ser-line-casing',
        type: 'line',
        source: 'ser-streets',
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#ffffff',
          'line-width': 8,
          'line-opacity': 0.8
        }
      });

      // Capa Verde
      map.current.addLayer({
        id: 'ser-line-verde',
        type: 'line',
        source: 'ser-streets',
        filter: ['==', ['get', 'color'], 'VERDE'],
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#16a34a',
          'line-width': 5,
          'line-opacity': 0.95
        }
      });

      // Capa Azul
      map.current.addLayer({
        id: 'ser-line-azul',
        type: 'line',
        source: 'ser-streets',
        filter: ['==', ['get', 'color'], 'AZUL'],
        layout: { 'line-join': 'round', 'line-cap': 'round' },
        paint: {
          'line-color': '#2563eb',
          'line-width': 5,
          'line-opacity': 0.95
        }
      });

      // Popup al hacer click en un tramo SER
      const popup = new maplibregl.Popup({ closeButton: false, closeOnClick: true, offset: 10 });

      const handleLineClick = (e: any) => {
        if (!e.features || !e.features[0]) return;
        const props = e.features[0].properties;
        const colorBadge = props.color === 'VERDE'
          ? '<span class="bg-green-100 text-green-800 font-semibold px-2 py-0.5 rounded text-xs">Zona Verde (Residentes / 2h max)</span>'
          : '<span class="bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded text-xs">Zona Azul (Visitantes / 4h max)</span>';

        popup.setLngLat(e.lngLat)
          .setHTML(`
            <div class="p-2 font-sans">
              <h3 class="font-bold text-gray-900 text-sm mb-1">${props.nombre_calle}</h3>
              <div class="mb-2">${colorBadge}</div>
              <p class="text-xs text-gray-600 mb-1"><strong>Plazas:</strong> ${props.num_plazas}</p>
              <p class="text-xs text-gray-500"><strong>Distrito:</strong> ${props.distrito || 'Madrid'} (${props.barrio || ''})</p>
            </div>
          `)
          .addTo(map.current!);
      };

      map.current.on('click', 'ser-line-verde', handleLineClick);
      map.current.on('click', 'ser-line-azul', handleLineClick);

      map.current.on('mouseenter', 'ser-line-verde', () => { map.current!.getCanvas().style.cursor = 'pointer'; });
      map.current.on('mouseleave', 'ser-line-verde', () => { map.current!.getCanvas().style.cursor = ''; });
      map.current.on('mouseenter', 'ser-line-azul', () => { map.current!.getCanvas().style.cursor = 'pointer'; });
      map.current.on('mouseleave', 'ser-line-azul', () => { map.current!.getCanvas().style.cursor = ''; });

      // Click en cualquier punto del mapa para seleccionar ubicación de aparcamiento
      map.current.on('click', (e) => {
        if (onSelectLocation) {
          onSelectLocation({ lat: e.lngLat.lat, lng: e.lngLat.lng });
        }
      });
    });

    return () => {
      map.current?.remove();
      map.current = null;
    };
  }, []);

  // Actualizar datos GeoJSON cuando cambien
  useEffect(() => {
    if (!map.current) return;
    const source = map.current.getSource('ser-streets') as maplibregl.GeoJSONSource;
    if (source && geojsonData) {
      source.setData(geojsonData);
    }
  }, [geojsonData]);

  // Actualizar visibilidad de capas según filtros
  useEffect(() => {
    if (!map.current || !map.current.isStyleLoaded()) return;

    if (map.current.getLayer('ser-line-verde')) {
      map.current.setLayoutProperty(
        'ser-line-verde',
        'visibility',
        filters.showVerde ? 'visible' : 'none'
      );
    }

    if (map.current.getLayer('ser-line-azul')) {
      map.current.setLayoutProperty(
        'ser-line-azul',
        'visibility',
        filters.showAzul ? 'visible' : 'none'
      );
    }
  }, [filters]);

  // Manejar animación FlyTo cuando el usuario selecciona una calle en el buscador
  useEffect(() => {
    if (!map.current || !flyToCoords) return;
    map.current.flyTo({
      center: flyToCoords,
      zoom: 16,
      essential: true,
      duration: 1800
    });
  }, [flyToCoords]);

  // Pintar marcador del coche aparcado
  useEffect(() => {
    if (!map.current) return;

    if (activeParking) {
      if (!parkingMarker.current) {
        const el = document.createElement('div');
        el.className = 'parking-car-marker';
        el.innerHTML = `
          <div class="relative flex items-center justify-center">
            <span class="animate-ping absolute inline-flex h-10 w-10 rounded-full bg-red-400 opacity-75"></span>
            <div class="relative bg-red-600 text-white rounded-full p-2.5 shadow-xl border-2 border-white flex items-center justify-center">
              🚗
            </div>
          </div>
        `;
        parkingMarker.current = new maplibregl.Marker({ element: el })
          .setLngLat([activeParking.lng, activeParking.lat])
          .addTo(map.current);
      } else {
        parkingMarker.current.setLngLat([activeParking.lng, activeParking.lat]);
      }
    } else if (parkingMarker.current) {
      parkingMarker.current.remove();
      parkingMarker.current = null;
    }
  }, [activeParking]);

  return <div ref={mapContainer} className="w-full h-full" />;
};
