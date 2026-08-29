import { useEffect, useRef } from 'react';
import type L from 'leaflet';

interface MapaOrigenProps {
  ubicacion?: string;
  lat?: number;
  lng?: number;
  altura?: number;
}

const coordenadasPorDefecto: Record<string, [number, number]> = {
  'Manizales': [5.07, -75.52],
  'Villamaría': [5.05, -75.52],
  'Chinchiná': [4.98, -75.60],
  'Neira': [5.17, -75.52],
  'Palestina': [5.02, -75.62],
  'Anserma': [5.23, -75.78],
  'Supía': [5.45, -75.65],
  'La Dorada': [5.45, -74.67],
  'Salamina': [5.40, -75.48],
  'Riosucio': [5.42, -75.70],
  'Manzanares': [5.33, -75.15],
  'Aguadas': [5.62, -75.45],
  'Filadelfia': [5.30, -75.57],
  'Pereira': [4.81, -75.69],
  'Armenia': [4.53, -75.68],
  'Dosquebradas': [4.83, -75.67],
  'Santa Rosa de Cabal': [4.87, -75.62],
};

function obtenerCoordenadas(ubicacion: string): [number, number] {
  for (const [nombre, coords] of Object.entries(coordenadasPorDefecto)) {
    if (ubicacion.toLowerCase().includes(nombre.toLowerCase())) {
      return coords;
    }
  }
  return [5.07, -75.52];
}

export default function MapaOrigen({ ubicacion = 'Manizales, Caldas', lat, lng, altura = 200 }: MapaOrigenProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);

  useEffect(() => {
    let map: L.Map | null = null;

    async function initMap() {
      if (!mapRef.current) return;
      const L = await import('leaflet');
      const coords: [number, number] = lat != null && lng != null ? [lat, lng] : obtenerCoordenadas(ubicacion);

      const icon = L.divIcon({
        html: `<div class="w-8 h-8 bg-campo-600 rounded-full flex items-center justify-center shadow-lg border-2 border-white"><svg class="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/></svg></div>`,
        className: 'custom-marker',
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      map = L.map(mapRef.current, {
        center: coords,
        zoom: 11,
        scrollWheelZoom: false,
        zoomControl: true,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        maxZoom: 19,
      }).addTo(map);

      L.marker(coords, { icon }).addTo(map)
        .bindPopup(`<b>${ubicacion}</b><br/>Origen del producto`)
        .openPopup();

      mapInstanceRef.current = map;
    }

    if (!mapInstanceRef.current) {
      initMap();
    }

    return () => {
      if (map) {
        map.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [ubicacion, lat, lng]);

  return (
    <div className="rounded-xl overflow-hidden border border-slate-200 shadow-sm">
      <div className="px-4 py-3 bg-gradient-to-r from-campo-50 to-white border-b border-slate-100 flex items-center gap-2">
        <svg className="w-4 h-4 text-campo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        <span className="text-sm font-semibold text-slate-700">Ubicación de origen: {ubicacion}</span>
      </div>
      <div ref={mapRef} style={{ height: `${altura}px`, width: '100%' }} />
    </div>
  );
}