interface QRTrazabilidadProps {
  productoId?: number;
  nombre?: string;
  url?: string;
  tamanio?: number;
}

export default function QRTrazabilidad({ productoId, nombre = 'Producto', url, tamanio = 160 }: QRTrazabilidadProps) {
  const qrUrl = url || (typeof window !== 'undefined'
    ? `${window.location.origin}/marketplace/${productoId}`
    : `/marketplace/${productoId}`);

  const qrApiUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${tamanio}x${tamanio}&data=${encodeURIComponent(qrUrl)}`;

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
      <div className="px-4 py-3 bg-gradient-to-r from-campo-50 to-white border-b border-slate-100 flex items-center gap-2">
        <svg className="w-4 h-4 text-campo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
        </svg>
        <span className="text-sm font-semibold text-slate-700">QR de trazabilidad</span>
      </div>
      <div className="p-5 text-center">
        <img
          src={qrApiUrl}
          alt={`QR de trazabilidad para ${nombre}`}
          className="mx-auto rounded-lg shadow-sm"
          width={tamanio}
          height={tamanio}
          loading="lazy"
        />
        <p className="text-xs text-slate-500 mt-3">
          Escanea para ver el historial digital del producto
        </p>
        <p className="text-xs text-slate-400 mt-1 font-mono break-all">
          {qrUrl}
        </p>
      </div>
    </div>
  );
}