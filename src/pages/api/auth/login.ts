import type { APIRoute } from 'astro';
import { queryGet, queryRun } from '../../../lib/db';
import { generarToken, verificarPassword } from '../../../lib/auth';
import { createRateLimiter, getClientIp, WINDOW_15_MIN } from '../../../lib/rate-limit';

// Máximo 5 intentos fallidos por IP en 15 minutos
const loginLimiter = createRateLimiter({ windowMs: WINDOW_15_MIN, max: 5 });

export const POST: APIRoute = async ({ request }) => {
  try {
    const ip = getClientIp(request);

    const bloqueo = loginLimiter.isBlocked(ip);
    if (bloqueo.blocked) {
      const minutos = Math.max(1, Math.ceil(bloqueo.retryAfterSeconds / 60));
      return new Response(JSON.stringify({
        error: `Demasiados intentos fallidos. Intenta de nuevo en ${minutos} minuto(s).`,
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(bloqueo.retryAfterSeconds),
        },
      });
    }

    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email y contraseña son requeridos' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const usuario = await queryGet<any>('SELECT * FROM usuarios WHERE email = ?', [email]);

    if (!usuario) {
      loginLimiter.hit(ip);
      // Respuesta genérica para no filtrar si el email existe o no
      return new Response(JSON.stringify({ error: 'Credenciales incorrectas' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!usuario.password_hash) {
      loginLimiter.hit(ip);
      return new Response(JSON.stringify({ error: 'Esta cuenta no tiene contraseña. Crea una contraseña primero.' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    // Verificación con migración transparente SHA-256 → bcrypt
    const { ok, nuevoHash } = await verificarPassword(password, usuario.password_hash);

    if (!ok) {
      loginLimiter.hit(ip);
      return new Response(JSON.stringify({ error: 'Credenciales incorrectas' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    // Login exitoso: reinicia el contador de intentos fallidos para esta IP
    loginLimiter.reset(ip);

    // Migración transparente: si el hash era SHA-256, actualizarlo a bcrypt ahora
    if (nuevoHash) {
      await queryRun(
        'UPDATE usuarios SET password_hash = ? WHERE id = ?',
        [nuevoHash, usuario.id],
      );
      console.info(`[auth] Hash migrado de SHA-256 a bcrypt para usuario ${usuario.id}`);
    }

    const token = generarToken({ id: usuario.id, email: usuario.email, rol: usuario.rol || 'comprador' });

    return new Response(JSON.stringify({
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
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error en login:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};