import { queryAll, queryGet } from '../db';

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

export async function getInventario(): Promise<Animal[]> {
  return queryAll<Animal>('SELECT * FROM inventario ORDER BY codigo');
}

export async function getEstadisticas(): Promise<EstadisticasDashboard> {
  const stats = await queryGet<any>('SELECT * FROM dashboard_estadisticas WHERE id = 1');
  return {
    totalCabezas:       stats?.total_cabezas      ?? 0,
    alertasSalud:       stats?.alertas_salud       ?? 0,
    promedioPeso:       stats?.promedio_peso        ?? 0,
    crecimientoMensual: stats?.crecimiento_mensual  ?? 0,
    rendimientoPromedio:stats?.rendimiento_promedio  ?? 0,
    produccionLeche:    stats?.produccion_leche      ?? 0,
  };
}

export async function getIndicadoresCrecimiento(): Promise<IndicadorCrecimiento[]> {
  return queryAll<IndicadorCrecimiento>('SELECT mes, peso, produccion FROM indicadores_crecimiento ORDER BY id');
}

export async function getAnimalById(id: number): Promise<Animal | undefined> {
  return queryGet<Animal>('SELECT * FROM inventario WHERE id = ?', [id]);
}

export async function getAnimalPorCodigo(codigo: string): Promise<Animal | undefined> {
  return queryGet<Animal>('SELECT * FROM inventario WHERE codigo = ?', [codigo]);
}