import type { APIRoute } from 'astro';
import { queryGet, queryRun } from '../../../lib/db';
import { generarToken, verificarPassword, hashPassword, getTokenFromRequest } from '../../../lib/auth';

export const PUT: APIRoute = async ({ request }) => {
  try {
    const tokenPayload = getTokenFromRequest(request);
    if (!tokenPayload) {
      return new Response(JSON.stringify({ error: 'No autorizado' }), { status: 401 });
    }

    const usuarioActual = await queryGet<any>('SELECT * FROM usuarios WHERE id = ?', [tokenPayload.id]);
    if (!usuarioActual) {
      return new Response(JSON.stringify({ error: 'Usuario no encontrado' }), { status: 404 });
    }

    // Renovar token con datos frescos de la BD
    const nuevoToken = generarToken({
      id:    usuarioActual.id,
      email: usuarioActual.email,
      rol:   usuarioActual.rol || 'comprador',
    });

    const body = await request.json();

    // Sync avatar y logo: siempre deben ser la misma imagen
    if ('avatar' in body) body.logo   = body.avatar;
    if ('logo'   in body) body.avatar = body.logo;

    const nombre        = body.nombre        ?? usuarioActual.nombre;
    const email         = body.email         ?? usuarioActual.email;
    const celular       = body.celular        ?? usuarioActual.celular;
    const hacienda      = body.hacienda       ?? usuarioActual.hacienda      ?? '';
    const ciudad        = body.ciudad         ?? usuarioActual.ciudad         ?? '';
    const direccion     = body.direccion      ?? usuarioActual.direccion      ?? '';
    const municipio     = body.municipio      ?? usuarioActual.municipio      ?? '';
    const corregimiento = body.corregimiento  ?? usuarioActual.corregimiento  ?? '';
    const departamento  = body.departamento   ?? usuarioActual.departamento   ?? '';
    const whatsapp      = body.whatsapp       ?? usuarioActual.whatsapp       ?? '';
    const descripcion   = body.descripcion    ?? usuarioActual.descripcion    ?? '';
    const especies      = body.especies       ?? usuarioActual.especies        ?? '[]';
    const logo          = body.logo           ?? usuarioActual.logo           ?? '';
    const portada       = body.portada        ?? usuarioActual.portada        ?? '';
    const avatar        = body.avatar         ?? usuarioActual.avatar         ?? '';
    const passwordActual = body.passwordActual;
    const password       = body.password;

    if (email !== usuarioActual.email) {
      const existente = await queryGet<any>('SELECT id FROM usuarios WHERE email = ? AND id != ?', [email, tokenPayload.id]);
      if (existente) {
        return new Response(JSON.stringify({ error: 'Este email ya está en uso por otro usuario' }), { status: 400 });
      }
    }
    if (celular !== usuarioActual.celular) {
      const existente = await queryGet<any>('SELECT id FROM usuarios WHERE celular = ? AND id != ?', [celular, tokenPayload.id]);
      if (existente) {
        return new Response(JSON.stringify({ error: 'Este celular ya está en uso por otro usuario' }), { status: 400 });
      }
    }

    if (password) {
      if (!passwordActual) {
        return new Response(JSON.stringify({ error: 'Debes ingresar tu contraseña actual' }), { status: 400 });
      }
      if (password.length < 6) {
        return new Response(JSON.stringify({ error: 'La nueva contraseña debe tener al menos 6 caracteres' }), { status: 400 });
      }

      // Verificar contraseña actual (soporta hashes SHA-256 legacy + bcrypt)
      const { ok } = await verificarPassword(passwordActual, usuarioActual.password_hash);
      if (!ok) {
        return new Response(JSON.stringify({ error: 'La contraseña actual no es correcta' }), { status: 400 });
      }

      const passwordHash = await hashPassword(password);

      await queryRun(
        `UPDATE usuarios SET nombre = ?, email = ?, celular = ?, password_hash = ?,
           hacienda = ?, ciudad = ?, direccion = ?, municipio = ?, corregimiento = ?,
           departamento = ?, whatsapp = ?, descripcion = ?, especies = ?, logo = ?, portada = ?, avatar = ?
         WHERE id = ?`,
        [nombre, email, celular, passwordHash, hacienda, ciudad, direccion, municipio,
         corregimiento, departamento, whatsapp, descripcion, especies, logo, portada, avatar, tokenPayload.id],
      );
    } else {
      await queryRun(
        `UPDATE usuarios SET nombre = ?, email = ?, celular = ?,
           hacienda = ?, ciudad = ?, direccion = ?, municipio = ?, corregimiento = ?,
           departamento = ?, whatsapp = ?, descripcion = ?, especies = ?, logo = ?, portada = ?, avatar = ?
         WHERE id = ?`,
        [nombre, email, celular, hacienda, ciudad, direccion, municipio, corregimiento,
         departamento, whatsapp, descripcion, especies, logo, portada, avatar, tokenPayload.id],
      );
    }

    return new Response(JSON.stringify({
      success: true,
      token: nuevoToken,
      user: {
        id: tokenPayload.id, email, celular, nombre,
        verificado: Boolean(usuarioActual.verificado),
        rol: usuarioActual.rol,
        avatar, hacienda, ciudad, direccion, municipio, corregimiento,
        departamento, whatsapp, descripcion, especies, logo, portada,
      },
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });

  } catch (error) {
    console.error('Error en actualizar perfil:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};
