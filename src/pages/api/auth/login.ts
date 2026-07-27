import type { APIRoute } from 'astro';
import { queryAll, queryGet, queryRun } from '../../../lib/db';
import crypto from 'crypto';

function generarToken(id: number, email: string): string {
  const payload = { id, email, exp: Date.now() + 365 * 24 * 60 * 60 * 1000 };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email y contraseña son requeridos' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }

    const usuario = await queryGet<any>('SELECT * FROM usuarios WHERE email = ?', [email]);

    if (!usuario) {
      return new Response(JSON.stringify({ error: 'Credenciales incorrectas' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!usuario.password_hash) {
      return new Response(JSON.stringify({ error: 'Esta cuenta no tiene contraseña. Crea una contraseña primero.' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    if (hashPassword(password) !== usuario.password_hash) {
      return new Response(JSON.stringify({ error: 'Credenciales incorrectas' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = generarToken(usuario.id, usuario.email);

    return new Response(JSON.stringify({
      success: true,
      user: {
        id:           usuario.id,
        email:        usuario.email,
        celular:      usuario.celular,
        nombre:       usuario.nombre,
        verificado:   Boolean(usuario.verificado),
        rol:          usuario.rol,
        avatar:       usuario.avatar       || '',
        hacienda:     usuario.hacienda     || '',
        ciudad:       usuario.ciudad       || '',
        direccion:    usuario.direccion    || '',
        municipio:    usuario.municipio    || '',
        corregimiento:usuario.corregimiento|| '',
        departamento: usuario.departamento || '',
        whatsapp:     usuario.whatsapp     || '',
        descripcion:  usuario.descripcion  || '',
        especies:     usuario.especies     || '[]',
        logo:         usuario.logo         || '',
        portada:      usuario.portada      || '',
      },
      token,
    }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  } catch (error) {
    console.error('Error en login:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};