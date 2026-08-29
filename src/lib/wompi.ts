import crypto from 'crypto';

const getEnv = (key: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
    return import.meta.env[key] as string;
  }
  return '';
};

export const WOMPI_PRIVATE_KEY = () => getEnv('WOMPI_PRIVATE_KEY');
export const WOMPI_PUBLIC_KEY = () => getEnv('WOMPI_PUBLIC_KEY');
export const WOMPI_INTEGRITY_SECRET = () => getEnv('WOMPI_INTEGRITY_SECRET');
export const WOMPI_EVENTS_SECRET = () => getEnv('WOMPI_EVENTS_SECRET');
export const WOMPI_ENV = () => getEnv('WOMPI_ENV') || 'sandbox';

export const getWompiBaseUrl = (): string =>
  WOMPI_ENV() === 'production'
    ? 'https://production.wompi.co/v1'
    : 'https://sandbox.wompi.co/v1';

export const WOMPI_CHECKOUT_URL = 'https://checkout.wompi.co/l/';

export type WompiTransactionStatus = 'PENDING' | 'APPROVED' | 'DECLINED' | 'VOIDED' | 'ERROR';

export interface WompiTransaction {
  id: string;
  created_at: string;
  finalized_at: string | null;
  amount_in_cents: number;
  reference: string;
  currency: string;
  payment_method_type: string;
  payment_method: {
    type: string;
    extra?: Record<string, unknown>;
    [key: string]: unknown;
  };
  status: WompiTransactionStatus;
  status_message: string | null;
  merchant: {
    id: number;
    name: string;
    public_key: string;
    [key: string]: unknown;
  };
  taxes: unknown[];
}

export interface WompiPaymentLinkResponse {
  data: {
    id: string;
    name: string;
    description: string;
    single_use: boolean;
    amount_in_cents: number | null;
    currency: string;
    url?: string;
    booking_url?: string;
    expires_at: string | null;
    created_at: string;
    updated_at: string;
    status: string;
  };
}

export async function crearPaymentLink(params: {
  nombre: string;
  descripcion: string;
  montoCentavos: number;
  expiracionHoras?: number;
  usoUnico?: boolean;
  redirectUrl?: string;
}): Promise<WompiPaymentLinkResponse> {
  const privateKey = WOMPI_PRIVATE_KEY();
  if (!privateKey) {
    throw new Error('WOMPI_PRIVATE_KEY no está configurada en las variables de entorno.');
  }

  const body: Record<string, any> = {
    name: params.nombre,
    description: params.descripcion,
    single_use: params.usoUnico ?? true,
    amount_in_cents: params.montoCentavos,
    currency: 'COP',
    collect_shipping: false,
  };

  if (params.redirectUrl) {
    body.redirect_url = params.redirectUrl;
  }

  if (params.expiracionHoras) {
    const expDate = new Date(Date.now() + params.expiracionHoras * 60 * 60 * 1000);
    body.expires_at = expDate.toISOString().split('.')[0];
  }

  const res = await fetch(`${getWompiBaseUrl()}/payment_links`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${privateKey}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();

  if (!res.ok || !data.data?.id) {
    const errMsg = data.error?.reason || data.error?.message || data.error || (data.errors ? JSON.stringify(data.errors) : 'Error creando payment link en Wompi');
    throw new Error(typeof errMsg === 'string' ? errMsg : JSON.stringify(errMsg));
  }

  return data;
}

export async function verificarTransaccion(transactionId: string): Promise<WompiTransaction> {
  const privateKey = WOMPI_PRIVATE_KEY();
  const res = await fetch(`${getWompiBaseUrl()}/transactions/${transactionId}`, {
    headers: { 'Authorization': `Bearer ${privateKey}` },
  });

  if (!res.ok) {
    throw new Error(`Error verificando transacción ${transactionId}`);
  }

  const data = await res.json();
  return data.data;
}

export async function verificarTransaccionPorReferencia(reference: string): Promise<WompiTransaction | null> {
  const privateKey = WOMPI_PRIVATE_KEY();
  const res = await fetch(`${getWompiBaseUrl()}/transactions?reference=${encodeURIComponent(reference)}`, {
    headers: { 'Authorization': `Bearer ${privateKey}` },
  });

  if (!res.ok) return null;

  const data = await res.json();
  return data.data?.[0] || null;
}

export interface WompiPaymentLinkDetail {
  id: string;
  name: string;
  status: string;
  amount_in_cents: number | null;
  currency: string;
  transactions?: {
    data: WompiTransaction[];
  };
}

export async function verificarPaymentLink(paymentLinkId: string): Promise<WompiPaymentLinkDetail | null> {
  const privateKey = WOMPI_PRIVATE_KEY();
  const res = await fetch(`${getWompiBaseUrl()}/payment_links/${paymentLinkId}`, {
    headers: { 'Authorization': `Bearer ${privateKey}` },
  });
  if (!res.ok) return null;
  const data = await res.json();
  return data.data || null;
}

export function mapWompiStatus(status: WompiTransactionStatus): string {
  const statusMap: Record<WompiTransactionStatus, string> = {
    'PENDING': 'pendiente',
    'APPROVED': 'pagado',
    'DECLINED': 'rechazado',
    'VOIDED': 'anulado',
    'ERROR': 'error',
  };
  return statusMap[status] || 'pendiente';
}

/**
 * Valida la firma (checksum) de un evento de webhook de Wompi.
 *
 * Especificación oficial de Wompi ("Eventos" / "Firmas y Checksum de Eventos"):
 * 1. Identificar los campos listados en `signature.properties` del payload.
 * 2. Concatenar los valores correspondientes dentro de `data` en el orden exacto (sin separadores).
 * 3. Concatenar el valor del campo `timestamp` (entero Unix).
 * 4. Concatenar el Secreto de Eventos (`WOMPI_EVENTS_SECRET`).
 * 5. Aplicar SHA-256 a la cadena en formato hexadecimal (minúsculas).
 * 6. Comparar con `signature.checksum` usando tiempo constante (timingSafeEqual).
 */
export function validarChecksumWompi(body: any, customSecret?: string): boolean {
  try {
    const eventsSecret = customSecret || WOMPI_EVENTS_SECRET();
    if (!eventsSecret) {
      console.warn('[WOMPI/VALIDATE] WOMPI_EVENTS_SECRET no configurado en entorno.');
      return false;
    }

    if (
      !body ||
      !body.signature ||
      typeof body.signature.checksum !== 'string' ||
      !Array.isArray(body.signature.properties) ||
      body.timestamp === undefined ||
      body.timestamp === null
    ) {
      return false;
    }

    const { properties, checksum } = body.signature;
    const { data, timestamp } = body;

    let concatValues = '';
    for (const prop of properties) {
      const parts = prop.split('.');
      let val: any = data;
      for (const part of parts) {
        if (val === null || val === undefined) break;
        val = val[part];
      }
      if (val === null || val === undefined) {
        val = '';
      }
      concatValues += String(val);
    }

    const stringToHash = `${concatValues}${timestamp}${eventsSecret}`;
    const calculatedChecksum = crypto
      .createHash('sha256')
      .update(stringToHash, 'utf8')
      .digest('hex')
      .toLowerCase();

    const incomingChecksum = checksum.toLowerCase();

    if (calculatedChecksum.length !== incomingChecksum.length) {
      return false;
    }

    return crypto.timingSafeEqual(
      Buffer.from(calculatedChecksum, 'utf8'),
      Buffer.from(incomingChecksum, 'utf8')
    );
  } catch (err) {
    console.error('[WOMPI/VALIDATE] Error al verificar firma:', err);
    return false;
  }
}
