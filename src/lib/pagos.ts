export type MetodoPago = 'pse' | 'nequi' | 'daviplata' | 'tarjeta' | 'whatsapp' | 'efectivo';

export interface PaymentMethod {
  id: MetodoPago;
  nombre: string;
  descripcion: string;
  icono: string;
  color: string;
  disponible: boolean;
}

export const metodosPago: PaymentMethod[] = [
  {
    id: 'pse',
    nombre: 'PSE - Pagos Seguros en Línea',
    descripcion: 'Pago directo desde tu banco',
    icono: 'building-columns',
    color: 'bg-blue-600',
    disponible: true,
  },
  {
    id: 'nequi',
    nombre: 'Nequi',
    descripcion: 'Pago desde tu billetera Nequi',
    icono: 'wallet',
    color: 'bg-pink-600',
    disponible: true,
  },
  {
    id: 'daviplata',
    nombre: 'Daviplata',
    descripcion: 'Pago desde Daviplata',
    icono: 'credit-card',
    color: 'bg-red-600',
    disponible: true,
  },
  {
    id: 'tarjeta',
    nombre: 'Tarjeta de Crédito/Débito',
    descripcion: 'Visa, Mastercard, American Express',
    icono: 'credit-card',
    color: 'bg-purple-600',
    disponible: true,
  },
  {
    id: 'efectivo',
    nombre: 'Pago en Efectivo',
    descripcion: 'Pago contra entrega o presencial',
    icono: 'banknotes',
    color: 'bg-green-600',
    disponible: true,
  },
  {
    id: 'whatsapp',
    nombre: 'WhatsApp',
    descripcion: 'Coordina tu pago por WhatsApp',
    icono: 'whatsapp',
    color: 'bg-green-500',
    disponible: true,
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