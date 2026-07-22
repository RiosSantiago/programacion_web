import type { APIRoute } from 'astro';
import { db } from '../../../lib/db';
import crypto from 'crypto';

interface Usuario {
  id: number;
  email: string;
  celular: string;
}

function generarToken(id: number, email: string): string {
  const payload = { id, email, exp: Date.now() + 365 * 24 * 60 * 60 * 1000 };
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
    const { nombre, email, celular, password } = await request.json();

    if (!nombre || !email || !celular || !password) {
      return new Response(JSON.stringify({ error: 'Todos los campos son requeridos' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    if (password.length < 6) {
      return new Response(JSON.stringify({ error: 'La contraseña debe tener al menos 6 caracteres' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const existente = db.prepare('SELECT id FROM usuarios WHERE email = ? OR celular = ?').get(email, celular) as Usuario | undefined;

    if (existente) {
      return new Response(JSON.stringify({ error: 'Este email o celular ya está registrado' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const passwordHash = hashPassword(password);

    const result = db.prepare(`
      INSERT INTO usuarios (nombre, email, celular, password_hash, password_text, verificado, rol, hacienda, ciudad, direccion, municipio, corregimiento)
      VALUES (?, ?, ?, ?, ?, 1, '', '', '', '', '', '')
    `).run(nombre, email, celular, passwordHash, password);

    const usuarioId = result.lastInsertRowid as number;
    const token = generarToken(usuarioId, email);

    const userResponse = {
      id: usuarioId,
      email,
      celular,
      nombre,
      verificado: true,
      rol: '',
      avatar: '',
      hacienda: '',
      ciudad: '',
      direccion: '',
      municipio: '',
      corregimiento: '',
      departamento: '',
      whatsapp: '',
      descripcion: '',
      especies: '[]',
      logo: '',
      portada: '',
    };

    return new Response(JSON.stringify({ 
      success: true, 
      user: userResponse,
      token 
    }), {
      status: 201,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Error en registro:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};