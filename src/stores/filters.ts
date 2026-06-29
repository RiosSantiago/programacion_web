import { atom, map } from 'nanostores';

export interface FilterState {
  categoria: string;
  departamento: string;
  precioMin: number;
  precioMax: number;
  verificado: boolean;
}

export const $filters = map<FilterState>({
  categoria: 'todos',
  departamento: '',
  precioMin: 0,
  precioMax: 10000000,
  verificado: false,
});

export function setFilter<K extends keyof FilterState>(key: K, value: FilterState[K]) {
  $filters.setKey(key, value);
}
