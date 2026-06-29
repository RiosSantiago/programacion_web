import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import crypto from 'crypto';

interface Usuario {
  id: number;
  email: string;
  celular: string;
  nombre: string;
  password_hash: string | null;
  verificado: number;
  rol: string;
  avatar: string | null;
  created_at: string;
  hacienda: string | null;
  ciudad: string | null;
  direccion: string | null;
  municipio: string | null;
  corregimiento: string | null;
}

function generarToken(id: number, email: string): string {
  const payload = { id, email, exp: Date.now() + 7 * 24 * 60 * 60 * 1000 };
  return Buffer.from(JSON.stringify(payload)).toString('base64');
}

function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

function verificarPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return new Response(JSON.stringify({ error: 'Email y contraseña son requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const usuario = db.prepare('SELECT * FROM usuarios WHERE email = ?').get(email) as Usuario | undefined;

    if (!usuario) {
      return new Response(JSON.stringify({ error: 'Credenciales incorrectas' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!usuario.password_hash) {
      return new Response(JSON.stringify({ error: 'Esta cuenta no tiene contraseña. Crea una contraseña primero.' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const passwordValida = verificarPassword(password, usuario.password_hash);
    if (!passwordValida) {
      return new Response(JSON.stringify({ error: 'Credenciales incorrectas' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const token = generarToken(usuario.id, usuario.email);

    const userResponse = {
      id: usuario.id,
      email: usuario.email,
      celular: usuario.celular,
      nombre: usuario.nombre,
      verificado: usuario.verificado === 1,
      rol: usuario.rol,
      avatar: usuario.avatar,
      hacienda: usuario.hacienda || '',
      ciudad: usuario.ciudad || '',
      direccion: usuario.direccion || '',
      municipio: usuario.municipio || '',
      corregimiento: usuario.corregimiento || '',
    };

    return new Response(JSON.stringify({ 
      success: true, 
      user: userResponse,
      token 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en login:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};