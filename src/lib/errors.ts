// =============================================================================
// src/lib/errors.ts — Errores de negocio intencionales con status HTTP
// Permite diferenciar en un catch los errores que SÍ deben mostrarse al
// usuario (validaciones de negocio: stock, no encontrado, etc.) de los
// errores internos (Postgres, sharp, fs) que deben sanitizarse en la respuesta.
// =============================================================================

export class ApiError extends Error {
  public readonly status: number;

  constructor(message: string, status = 400) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}