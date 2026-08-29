export type MetodoPago = 'pse' | 'tarjeta' | 'nequi' | 'daviplata' | 'efectivo' | 'whatsapp';

export interface PaymentMethod {
  id: MetodoPago;
  nombre: string;
  descripcion: string;
  icono: string;
  disponible: boolean;
  online: boolean;
}

export const metodosPago: PaymentMethod[] = [
  {
    id: 'pse',
    nombre: 'PSE',
    descripcion: 'Pago directo desde tu banco',
    icono: 'pse',
    disponible: true,
    online: true,
  },
  {
    id: 'tarjeta',
    nombre: 'Tarjeta de Crédito/Débito',
    descripcion: 'Visa, Mastercard',
    icono: 'tarjeta',
    disponible: true,
    online: true,
  },
  {
    id: 'nequi',
    nombre: 'Nequi',
    descripcion: 'Billetera digital',
    icono: 'nequi',
    disponible: true,
    online: true,
  },
  {
    id: 'daviplata',
    nombre: 'Daviplata',
    descripcion: 'Billetera digital',
    icono: 'daviplata',
    disponible: true,
    online: true,
  },
  {
    id: 'efectivo',
    nombre: 'Efectivo',
    descripcion: 'Contra entrega o presencial',
    icono: 'efectivo',
    disponible: true,
    online: false,
  },
  {
    id: 'whatsapp',
    nombre: 'WhatsApp',
    descripcion: 'Coordina tu pago por chat',
    icono: 'whatsapp',
    disponible: true,
    online: false,
  },
];

export function getMetodoPago(id: MetodoPago): PaymentMethod | undefined {
  return metodosPago.find((m) => m.id === id);
}

export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('es-CO', {
    style: 'currency',
    currency: 'COP',
    minimumFractionDigits: 0,
  }).format(value);
}
