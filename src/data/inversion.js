export const haciendasInversion = [
  {
    id: 1,
    nombre: 'Hacienda La Pradera',
    ubicacion: 'Meta, Colombia',
    valorInversion: 3500000,
    rendimientoEsperado: 12.5,
    periodo: 12,
    riesgo: 'Bajo',
  },
  {
    id: 2,
    nombre: 'Hacienda El Porvenir',
    ubicacion: 'Casanare, Colombia',
    valorInversion: 2800000,
    rendimientoEsperado: 8.3,
    periodo: 18,
    riesgo: 'Medio',
  },
  {
    id: 3,
    nombre: 'Finca San Miguel',
    ubicacion: 'Cundinamarca, Colombia',
    valorInversion: 4200000,
    rendimientoEsperado: 15.2,
    periodo: 12,
    riesgo: 'Bajo',
  },
];

export const nivelesRiesgo = {
  Bajo: { color: 'bg-emerald-100 text-emerald-800', icon: '↓' },
  Medio: { color: 'bg-amber-100 text-amber-800', icon: '→' },
  Alto: { color: 'bg-red-100 text-red-800', icon: '↑' },
};
