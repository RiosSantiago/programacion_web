import type { APIRoute } from 'astro';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { cwd } from 'process';
import sharp from 'sharp';
import { getTokenFromRequest, verificarToken } from '../../lib/auth';

// Límites de seguridad para subida de archivos (informe §3.5).
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB por archivo
const MAX_FILES_PER_TYPE = 5;
const MIME_PDF = 'application/pdf';

export const POST: APIRoute = async ({ request }) => {
  let tokenPayload: { id?: number } | null = null;
  try {
    console.log('[UPLOAD RAW] All headers:', JSON.stringify(Array.from(request.headers.entries())));
    console.log('[UPLOAD RAW] authHeader (Authorization):', request.headers.get('Authorization'));
    console.log('[UPLOAD RAW] authorization (lowercase):', request.headers.get('authorization'));
    console.log('[UPLOAD RAW] AUTHORIZATION (uppercase):', request.headers.get('AUTHORIZATION'));
    console.log('[UPLOAD RAW] X-Test-Header:', request.headers.get('X-Test-Header') || request.headers.get('x-test-header'));

    tokenPayload = getTokenFromRequest(request);

    let formData: FormData | null = null;
    try {
      formData = await request.formData();
    } catch (e) {
      // El request no tiene multipart/form-data válido
    }

    const formDataAuth = formData ? ((formData.get('authorization') as string) || (formData.get('token') as string)) : null;
    const authHeader = request.headers.get('Authorization') || formDataAuth;

    console.log('[UPLOAD] Auth from FormData:', formDataAuth ? 'sí' : 'no');
    console.log('[UPLOAD] Auth from header:', request.headers.get('Authorization') ? 'sí' : 'no');

    if (!tokenPayload && formDataAuth) {
      const tokenStr = formDataAuth.startsWith('Bearer ') ? formDataAuth.slice(7) : formDataAuth;
      tokenPayload = verificarToken(tokenStr);
    }

    console.log(`[upload] Token payload:`, tokenPayload);

    if (!tokenPayload) {
      console.warn('[upload] ❌ Auth falló — token inválido o ausente');
      return new Response(JSON.stringify({ error: 'Debes iniciar sesión para subir archivos.' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    if (!formData) {
      return new Response(JSON.stringify({ error: 'Debes enviar un formulario multipart/form-data válido.' }), {
        status: 400, headers: { 'Content-Type': 'application/json' },
      });
    }
    console.log(`[upload] ✅ Auth OK — usuario ${tokenPayload.id}`);
    const photoFiles = formData.getAll('photos') as File[];
    const videoFile = formData.get('video') as File | null;
    const certFiles = formData.getAll('certificaciones') as File[];
    const categoria = (formData.get('categoria') as string || 'animales').replace(/[^a-z0-9_-]/g, '');

    // ── 1. Límite de tamaño (10 MB por archivo) aplicado a todo el request ──
    const allFiles = [...photoFiles, videoFile, ...certFiles].filter((f): f is File => !!f && f.size > 0);
    for (const file of allFiles) {
      if (file.size > MAX_FILE_SIZE) {
        console.warn(
          `[upload] Archivo rechazado por tamaño: "${file.name}" (${file.size} bytes > 10 MB), usuario ${tokenPayload.id}`,
        );
        return new Response(
          JSON.stringify({ error: `El archivo "${file.name}" supera el límite de 10 MB.` }),
          { status: 413, headers: { 'Content-Type': 'application/json' } },
        );
      }
    }

    // ── 2. Validación MIME: las certificaciones SOLO aceptan application/pdf ──
    for (const file of certFiles) {
      if (file.size > 0 && file.type !== MIME_PDF) {
        console.warn(
          `[upload] Certificación rechazada por MIME: "${file.name}" (tipo "${file.type || '(vacío)'}"), usuario ${tokenPayload.id}`,
        );
        return new Response(
          JSON.stringify({ error: `La certificación "${file.name}" debe ser un archivo PDF.` }),
          { status: 400, headers: { 'Content-Type': 'application/json' } },
        );
      }
    }

    const uploadDir = path.join(cwd(), 'public', 'uploads', categoria);
    await mkdir(uploadDir, { recursive: true });

    // ── 3. Fotos → conversión a WebP (sharp valida que el contenido sea imagen) ──
    const photoUrls: string[] = [];
    for (const file of photoFiles.slice(0, MAX_FILES_PER_TYPE)) {
      const buffer = Buffer.from(await file.arrayBuffer());
      if (buffer.length === 0) continue;
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
      const webpBuffer = await sharp(buffer).webp({ quality: 85 }).toBuffer();
      await writeFile(path.join(uploadDir, filename), webpBuffer);
      photoUrls.push(`/uploads/${categoria}/${filename}`);
    }

    // ── 4. Video → copia directa (límite de tamaño ya validado arriba) ──
    let videoUrl = '';
    if (videoFile && videoFile.size > 0) {
      const ext = path.extname(videoFile.name) || '.mp4';
      const filename = `${Date.now()}-video${ext}`;
      const buffer = Buffer.from(await videoFile.arrayBuffer());
      await writeFile(path.join(uploadDir, filename), buffer);
      videoUrl = `/uploads/${categoria}/${filename}`;
    }

    // ── 5. Certificaciones → PDFs validados (MIME + tamaño ya validados) ──
    const certUrls: string[] = [];
    for (const file of certFiles.slice(0, MAX_FILES_PER_TYPE)) {
      if (file.size > 0) {
        const filename = `${Date.now()}-cert-${Math.random().toString(36).slice(2, 8)}.pdf`;
        const buffer = Buffer.from(await file.arrayBuffer());
        await writeFile(path.join(uploadDir, filename), buffer);
        certUrls.push(`/uploads/${categoria}/${filename}`);
      }
    }

    return new Response(JSON.stringify({ success: true, urls: photoUrls, videoUrl, certUrls }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const detalle = error instanceof Error ? error.message : String(error);
    console.error(`[upload] Error al subir archivos (usuario ${tokenPayload?.id ?? 'anónimo'}):`, error);
    console.error(`[upload] Detalle: ${detalle}`);
    return new Response(JSON.stringify({ error: 'Ocurrió un error, intenta de nuevo' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};