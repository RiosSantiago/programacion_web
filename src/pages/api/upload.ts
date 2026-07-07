import type { APIRoute } from 'astro';
import { writeFile, mkdir } from 'fs/promises';
import path from 'path';
import { cwd } from 'process';

export const POST: APIRoute = async ({ request }) => {
  try {
    const formData = await request.formData();
    const photoFiles = formData.getAll('photos') as File[];
    const videoFile = formData.get('video') as File | null;

    const uploadDir = path.join(cwd(), 'public', 'uploads', 'animales');
    await mkdir(uploadDir, { recursive: true });

    const photoUrls: string[] = [];

    for (const file of photoFiles.slice(0, 5)) {
      const ext = path.extname(file.name) || '.jpg';
      const filename = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`;
      const buffer = Buffer.from(await file.arrayBuffer());
      await writeFile(path.join(uploadDir, filename), buffer);
      photoUrls.push(`/uploads/animales/${filename}`);
    }

    let videoUrl = '';
    if (videoFile && videoFile.size > 0) {
      const ext = path.extname(videoFile.name) || '.mp4';
      const filename = `${Date.now()}-video${ext}`;
      const buffer = Buffer.from(await videoFile.arrayBuffer());
      await writeFile(path.join(uploadDir, filename), buffer);
      videoUrl = `/uploads/animales/${filename}`;
    }

    return new Response(JSON.stringify({ success: true, urls: photoUrls, videoUrl }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Upload error:', error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};
