import type { APIRoute } from 'astro';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { cwd } from 'process';
import sharp from 'sharp';
import { getTokenFromRequest } from '../../lib/auth';

export const POST: APIRoute = async ({ request }) => {
  try {
    const tokenPayload = getTokenFromRequest(request);
    if (!tokenPayload) {
      return new Response(JSON.stringify({ error: 'Debes iniciar sesión para subir archivos.' }), {
        status: 401, headers: { 'Content-Type': 'application/json' },
      });
    }

    const formData = await request.formData();
    const photoFiles = formData.getAll('photos') as File[];
    const videoFile = formData.get('video') as File | null;
    const certFiles = formData.getAll('certificaciones') as File[];
    const categoria = (formData.get('categoria') as string || 'animales').replace(/[^a-z0-9_-]/g, '');

    const uploadDir = path.join(cwd(), 'public', 'uploads', categoria);
    await mkdir(uploadDir, { recursive: true });

    const photoUrls: string[] = [];

    for (const file of photoFiles.slice(0, 5)) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.webp`;
      const webpBuffer = await sharp(buffer).webp({ quality: 85 }).toBuffer();
      await writeFile(path.join(uploadDir, filename), webpBuffer);
      photoUrls.push(`/uploads/${categoria}/${filename}`);
    }

    let videoUrl = '';
    if (videoFile && videoFile.size > 0) {
      const ext = path.extname(videoFile.name) || '.mp4';
      const filename = `${Date.now()}-video${ext}`;
      const buffer = Buffer.from(await videoFile.arrayBuffer());
      await writeFile(path.join(uploadDir, filename), buffer);
      videoUrl = `/uploads/${categoria}/${filename}`;
    }

    const certUrls: string[] = [];
    for (const file of certFiles.slice(0, 5)) {
      if (file.size > 0) {
        const ext = path.extname(file.name) || '.pdf';
        const filename = `${Date.now()}-cert-${Math.random().toString(36).slice(2, 8)}${ext}`;
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
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ error: 'Ocurrió un error, intenta de nuevo' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
