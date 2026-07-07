import { db } from '../db';

export interface Animal {
  id: number;
  codigo: string;
  nombre: string;
  raza: string;
  edad: string;
  peso: number;
  ubicacion: string;
  estado: string;
  ultimo_check: string;
  created_at: string;
}

export interface EstadisticasDashboard {
  totalCabezas: number;
  alertasSalud: number;
  promedioPeso: number;
  crecimientoMensual: number;
  rendimientoPromedio: number;
  produccionLeche: number;
}

export interface IndicadorCrecimiento {
  mes: string;
  peso: number;
  produccion: number;
}

export function getInventario(): Animal[] {
  return db.prepare('SELECT * FROM inventario ORDER BY codigo').all() as Animal[];
}

export function getEstadisticas(): EstadisticasDashboard {
  const stats = db.prepare('SELECT * FROM dashboard_estadisticas WHERE id = 1').get() as any;
  return {
    totalCabezas: stats?.total_cabezas || 0,
    alertasSalud: stats?.alertas_salud || 0,
    promedioPeso: stats?.promedio_peso || 0,
    crecimientoMensual: stats?.crecimiento_mensual || 0,
    rendimientoPromedio: stats?.rendimiento_promedio || 0,
    produccionLeche: stats?.produccion_leche || 0,
  };
}

export function getIndicadoresCrecimiento(): IndicadorCrecimiento[] {
  return db.prepare('SELECT mes, peso, produccion FROM indicadores_crecimiento ORDER BY id').all() as IndicadorCrecimiento[];
}

export function getAnimalById(id: number): Animal | undefined {
  return db.prepare('SELECT * FROM inventario WHERE id = ?').get(id) as Animal | undefined;
}

export function getAnimalPorCodigo(codigo: string): Animal | undefined {
  return db.prepare('SELECT * FROM inventario WHERE codigo = ?').get(codigo) as Animal | undefined;
}