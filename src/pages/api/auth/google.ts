// =============================================================================
// src/pages/api/auth/google.ts — Inicio de sesión con Google
// Recibe el ID token (credential) del botón oficial de Google Identity
// Services, lo verifica contra los servidores de Google y:
//   1. Si existe un usuario con ese google_id            → inicia sesión.
//   2. Si existe un usuario con el mismo email           → vincula la cuenta
//      (guarda google_id y avatar si estaba vacío).
//   3. Si no existe                                      → crea el usuario
//      (rol 'comprador', verificado=true, sin contraseña ni celular).
// Retorna exactamente el mismo shape que /api/auth/login para que el
// frontend trate ambos flujos por igual.
// =============================================================================

import type { APIRoute } from 'astro';
import { OAuth2Client } from 'google-auth-library';
import { queryGet, queryRun } from '../../../lib/db';
import { generarToken } from '../../../lib/auth';

const GOOGLE_CLIENT_ID =
  (import.meta.env.GOOGLE_CLIENT_ID as string) ||
  (process.env.GOOGLE_CLIENT_ID as string) ||
  '';

const json = (data: unknown, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });

export const POST: APIRoute = async ({ request }) => {
  try {
    if (!GOOGLE_CLIENT_ID) {
      return json({ error: 'Inicio de sesión con Google no está configurado en el servidor' }, 503);
    }

    const { credential } = await request.json().catch(() => ({}));
    if (!credential || typeof credential !== 'string') {
      return json({ error: 'Falta el credential de Google' }, 400);
    }

    // ------------------------------------------------------------------
    // 1. Verificar el ID token con Google (firma + audiencia + expiración)
    // ------------------------------------------------------------------
    const client = new OAuth2Client(GOOGLE_CLIENT_ID);
    let payload;
    try {
      const ticket = await client.verifyIdToken({
        idToken: credential,
        audience: GOOGLE_CLIENT_ID,
      });
      payload = ticket.getPayload();
    } catch {
      return json({ error: 'Token de Google inválido o expirado' }, 401);
    }

    if (!payload?.sub || !payload.email) {
      return json({ error: 'Token de Google sin la información necesaria' }, 401);
    }
    if (!payload.email_verified) {
      return json({ error: 'El correo de tu cuenta de Google no está verificado' }, 401);
    }

    const googleId = payload.sub;
    const email = payload.email.toLowerCase();
    const nombre = (payload.name || email.split('@')[0]).slice(0, 255).trim() || 'Usuario';
    const avatar = payload.picture || '';

    // ------------------------------------------------------------------
    // 2. Buscar por google_id → login directo
    // ------------------------------------------------------------------
    let usuario = await queryGet<any>(
      'SELECT * FROM usuarios WHERE google_id = ?',
      [googleId],
    );

    // ------------------------------------------------------------------
    // 3. Buscar por email → vincular cuenta existente (registro normal)
    // ------------------------------------------------------------------
    if (!usuario) {
      usuario = await queryGet<any>(
        'SELECT * FROM usuarios WHERE LOWER(email) = ?',
        [email],
      );
      if (usuario) {
        await queryRun(
          `UPDATE usuarios SET google_id = ?,
             avatar = CASE WHEN COALESCE(avatar, '') = '' THEN ? ELSE avatar END
           WHERE id = ?`,
          [googleId, avatar, usuario.id],
        );
        console.info(`[auth/google] Cuenta vinculada por email: usuario ${usuario.id}`);
      }
    }

    // ------------------------------------------------------------------
    // 4. No existe → crear usuario nuevo vía Google
    // ------------------------------------------------------------------
    if (!usuario) {
      const { lastInsertRowid } = await queryRun(
        `INSERT INTO usuarios (nombre, email, celular, password_hash, verificado, rol,
           avatar, google_id, hacienda, ciudad, direccion, municipio, corregimiento)
         VALUES (?, ?, NULL, NULL, true, 'comprador', ?, ?, '', '', '', '', '')`,
        [nombre, email, avatar, googleId],
      );
      usuario = await queryGet<any>('SELECT * FROM usuarios WHERE id = ?', [lastInsertRowid]);
      console.info(`[auth/google] Usuario creado vía Google: id ${usuario.id}`);
    }

    // ------------------------------------------------------------------
    // 5. Emitir JWT propio (mismo formato que el login normal)
    // ------------------------------------------------------------------
    const token = generarToken({
      id: usuario.id,
      email: usuario.email,
      rol: usuario.rol || 'comprador',
    });

    return json({
      success: true,
      user: {
        id:            usuario.id,
        email:         usuario.email,
        celular:       usuario.celular,
        nombre:        usuario.nombre,
        verificado:    Boolean(usuario.verificado),
        rol:           usuario.rol,
        avatar:        usuario.avatar        || '',
        hacienda:      usuario.hacienda      || '',
        ciudad:        usuario.ciudad        || '',
        direccion:     usuario.direccion     || '',
        municipio:     usuario.municipio     || '',
        corregimiento: usuario.corregimiento || '',
        departamento:  usuario.departamento  || '',
        whatsapp:      usuario.whatsapp      || '',
        descripcion:   usuario.descripcion   || '',
        especies:      usuario.especies      || '[]',
        logo:          usuario.logo          || '',
        portada:       usuario.portada       || '',
      },
      token,
    });
  } catch (error) {
    console.error('Error en auth/google:', error);
    return json({ error: 'Error interno del servidor' }, 500);
  }
};
