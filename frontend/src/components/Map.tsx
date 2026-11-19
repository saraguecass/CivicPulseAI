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

    // Inicializar mapa centrado en el corazón del SER de Madrid con soporte completo de perspectiva 3D
    map.current = new maplibregl.Map({
      container: mapContainer.current,
      style: 'https://tiles.openfreemap.org/styles/liberty',
      center: [-3.688, 40.428], // Zona Salamanca / Chamberí
      zoom: 14,
      maxZoom: 19,
      minZoom: 11,
      pitch: 0,
      maxPitch: 75, // Permite inclinar la cámara en 3D
      dragRotate: true
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

      // Capa de fondo para efecto "glow" o contorno que se adapta a la perspectiva del mapa
      map.current.addLayer({
        id: 'ser-line-casing',
        type: 'line',
        source: 'ser-streets',
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#ffffff',
          'line-width': [
            'interpolate',
            ['exponential', 1.5],
            ['zoom'],
            11, 3,
            13, 5,
            15, 9,
            17, 18,
            19, 30
          ],
          'line-opacity': 0.85
        }
      });

      // Capa Verde: Escala con el zoom
      map.current.addLayer({
        id: 'ser-line-verde',
        type: 'line',
        source: 'ser-streets',
        filter: ['==', ['get', 'color'], 'VERDE'],
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#16a34a',
          'line-width': [
            'interpolate',
            ['exponential', 1.5],
            ['zoom'],
            11, 2,
            13, 3.5,
            15, 6.5,
            17, 13,
            19, 22
          ],
          'line-opacity': 0.95
        }
      });

      // Capa Azul: Escala con el zoom
      map.current.addLayer({
        id: 'ser-line-azul',
        type: 'line',
        source: 'ser-streets',
        filter: ['==', ['get', 'color'], 'AZUL'],
        layout: {
          'line-join': 'round',
          'line-cap': 'round'
        },
        paint: {
          'line-color': '#2563eb',
          'line-width': [
            'interpolate',
            ['exponential', 1.5],
            ['zoom'],
            11, 2,
            13, 3.5,
            15, 6.5,
            17, 13,
            19, 22
          ],
          'line-opacity': 0.95
        }
      });

      // Popup al mantener el ratón por encima (hover / mousemove) en un tramo SER
      const hoverPopup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        offset: 12
      });

      const handleLineHover = (e: any) => {
        if (!e.features || !e.features[0] || !map.current) return;
        map.current.getCanvas().style.cursor = 'pointer';

        const props = e.features[0].properties;
        const colorBadge = props.color === 'VERDE'
          ? '<span class="bg-green-100 text-green-800 font-semibold px-2 py-0.5 rounded text-xs">Zona Verde (Residentes / 2h max)</span>'
          : '<span class="bg-blue-100 text-blue-800 font-semibold px-2 py-0.5 rounded text-xs">Zona Azul (Visitantes / 4h max)</span>';

        hoverPopup.setLngLat(e.lngLat)
          .setHTML(`
            <div class="p-2 font-sans pointer-events-none">
              <h3 class="font-bold text-gray-900 text-sm mb-1">${props.nombre_calle}</h3>
              <div class="mb-2">${colorBadge}</div>
              <p class="text-xs text-gray-600 mb-1"><strong>Plazas:</strong> ${props.num_plazas}</p>
              <p class="text-xs text-gray-500"><strong>Distrito:</strong> ${props.distrito || 'Madrid'} (${props.barrio || ''})</p>
            </div>
          `)
          .addTo(map.current);
      };

      const handleLineLeave = () => {
        if (!map.current) return;
        map.current.getCanvas().style.cursor = '';
        hoverPopup.remove();
      };

      // Eventos Hover: mostrar tooltip solo al pasar o mover el ratón por encima
      map.current.on('mousemove', 'ser-line-verde', handleLineHover);
      map.current.on('mouseleave', 'ser-line-verde', handleLineLeave);

      map.current.on('mousemove', 'ser-line-azul', handleLineHover);
      map.current.on('mouseleave', 'ser-line-azul', handleLineLeave);

      // Click en cualquier punto del mapa exclusivamente para seleccionar ubicación de aparcamiento
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

    if (map.current.getLayer('ser-line-casing')) {
      const activeColors: string[] = [];
      if (filters.showVerde) activeColors.push('VERDE');
      if (filters.showAzul) activeColors.push('AZUL');

      map.current.setLayoutProperty(
        'ser-line-casing',
        'visibility',
        activeColors.length > 0 ? 'visible' : 'none'
      );
      if (activeColors.length > 0) {
        map.current.setFilter('ser-line-casing', ['in', ['get', 'color'], ['literal', activeColors]]);
      }
    }
  }, [filters]);

  // Manejar animación FlyTo cuando el usuario selecciona una calle o filtra por distrito
  useEffect(() => {
    if (!map.current || !flyToCoords) return;
    
    // Si hay un distrito activo, ajustar a zoom panorámico del distrito (~14), si es calle concreta zoom 16
    const targetZoom = filters.distrito ? 14 : 16;
    
    map.current.flyTo({
      center: flyToCoords,
      zoom: targetZoom,
      essential: true,
      duration: 1600
    });
  }, [flyToCoords, filters.distrito]);

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
