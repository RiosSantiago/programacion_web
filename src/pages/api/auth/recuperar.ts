import type { APIRoute } from 'astro';
import { queryGet, queryRun } from '../../../lib/db';
import { createRateLimiter, getClientIp, WINDOW_15_MIN } from '../../../lib/rate-limit';
import crypto from 'crypto';
import nodemailer from 'nodemailer';

// Máximo 3 solicitudes por IP y por email en 15 minutos
const recuperarLimiter       = createRateLimiter({ windowMs: WINDOW_15_MIN, max: 3 });
const recuperarEmailLimiter  = createRateLimiter({ windowMs: WINDOW_15_MIN, max: 3 });

export const POST: APIRoute = async ({ request }) => {
  try {
    const { email } = await request.json();

    if (!email) {
      return new Response(JSON.stringify({ error: 'El correo es requerido' }), { status: 400 });
    }

    const ip       = getClientIp(request);
    const emailKey = String(email).toLowerCase().trim();

    const bloqueoIp    = recuperarLimiter.isBlocked(ip);
    const bloqueoEmail = recuperarEmailLimiter.isBlocked(emailKey);
    if (bloqueoIp.blocked || bloqueoEmail.blocked) {
      const segundos = Math.max(bloqueoIp.retryAfterSeconds, bloqueoEmail.retryAfterSeconds);
      const minutos  = Math.max(1, Math.ceil(segundos / 60));
      return new Response(JSON.stringify({
        error: `Demasiadas solicitudes de recuperación. Intenta de nuevo en ${minutos} minuto(s).`,
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(segundos),
        },
      });
    }

    // Cuenta la solicitud (se limpia sola cuando expira la ventana)
    recuperarLimiter.hit(ip);
    recuperarEmailLimiter.hit(emailKey);

    const usuario = await queryGet<{ id: number; email: string; nombre: string }>(
      'SELECT id, email, nombre FROM usuarios WHERE email = ?', [email]
    );

    if (!usuario) {
      return new Response(JSON.stringify({ error: 'El correo electrónico no está registrado en nuestra plataforma' }), { status: 404 });
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExp = Date.now() + 60 * 60 * 1000;

    await queryRun('UPDATE usuarios SET reset_token = ?, reset_token_exp = ? WHERE id = ?', [resetToken, resetTokenExp, usuario.id]);

    const baseUrl  = new URL(request.url).origin;
    const resetUrl = `${baseUrl}/auth/restablecer-contrasena?token=${resetToken}`;

    const smtpHost = import.meta.env.SMTP_HOST;
    const smtpPort = import.meta.env.SMTP_PORT;
    const smtpUser = import.meta.env.SMTP_USER;
    const smtpPass = import.meta.env.SMTP_PASS;
    const smtpFrom = import.meta.env.SMTP_FROM || smtpUser;

    if (smtpHost && smtpUser && smtpPass) {
      const transporter = nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(smtpPort || '587'),
        secure: parseInt(smtpPort || '587') === 465,
        auth: { user: smtpUser, pass: smtpPass },
      });

      await transporter.sendMail({
        from: `"AgroUp" <${smtpFrom}>`,
        to: usuario.email,
        subject: 'Restablecer tu contraseña - AgroUp',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
            <div style="background: linear-gradient(135deg, #064E3B, #0B5D3B); border-radius: 12px; padding: 24px; text-align: center;">
              <h1 style="color: white; margin: 0; font-size: 24px;">AgroUp</h1>
            </div>
            <div style="background: #FFFDF7; border-radius: 12px; padding: 32px; margin-top: 16px; border: 1px solid #E8E0D8;">
              <h2 style="color: #1A0E08; margin-top: 0;">Hola ${usuario.nombre},</h2>
              <p style="color: #6B6B6B; line-height: 1.6;">Recibimos una solicitud para restablecer tu contraseña. Haz clic en el botón de abajo para crear una nueva:</p>
              <div style="text-align: center; margin: 28px 0;">
                <a href="${resetUrl}" style="display: inline-block; background: #064E3B; color: white; text-decoration: none; padding: 14px 32px; border-radius: 10px; font-weight: 600; font-size: 15px;">Restablecer contraseña</a>
              </div>
              <p style="color: #6B6B6B; font-size: 13px;">Este enlace expira en <strong>1 hora</strong>.</p>
              <p style="color: #6B6B6B; font-size: 13px;">Si no solicitaste este cambio, puedes ignorar este mensaje.</p>
            </div>
            <p style="text-align: center; color: #9CA3AF; font-size: 12px; margin-top: 16px;">AgroUp — El marketplace ganadero de Colombia</p>
          </div>
        `,
      });
    } else {
      console.log(`[PASSWORD RESET] Enlace de recuperación para ${usuario.email}: ${resetUrl}`);
    }

    return new Response(JSON.stringify({ success: true, message: 'Se envió un enlace de recuperación a tu correo electrónico.' }), { status: 200 });
  } catch (error) {
    console.error('Error en recuperar contraseña:', error);
    return new Response(JSON.stringify({ error: 'Error interno del servidor' }), { status: 500 });
  }
};
