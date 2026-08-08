import { NextRequest, NextResponse } from 'next/server';
import nodemailer from 'nodemailer';

export async function POST(req: NextRequest) {
  try {
    const { correo, nombre, tipoPermiso, estado, comentario } = await req.json();

    if (!correo) {
      return NextResponse.json({ ok: false, motivo: 'sin_correo' });
    }

    const TIPO_LABEL: Record<string, string> = {
      dia_descanso: 'Día de descanso',
      falta: 'Falta',
      llegada_tarde: 'Llegada tarde',
      cambio_descanso: 'Cambio de descanso',
    };

    const aprobado = estado === 'aprobado';
    const asunto = aprobado
      ? 'Tu solicitud de permiso fue autorizada'
      : 'Tu solicitud de permiso fue rechazada';

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    });

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto;">
        <div style="background:#284D71; padding:16px; border-radius:8px 8px 0 0;">
          <p style="color:white; margin:0; font-size:12px; letter-spacing:0.05em;">TURITICKET</p>
          <h2 style="color:white; margin:4px 0 0;">Solicitud de Permiso</h2>
        </div>
        <div style="border:1px solid #eee; padding:20px; border-radius:0 0 8px 8px;">
          <p>Hola ${nombre},</p>
          <p>Tu solicitud de <strong>${TIPO_LABEL[tipoPermiso] || tipoPermiso}</strong> fue
          <strong style="color:${aprobado ? '#16a34a' : '#D9272D'};">${aprobado ? 'AUTORIZADA' : 'RECHAZADA'}</strong>.</p>
          ${comentario ? `<p><em>Comentario de tu coordinador:</em><br/>${comentario}</p>` : ''}
          <p style="color:#888; font-size:13px; margin-top:24px;">Turiticket Operaciones</p>
        </div>
      </div>
    `;

    await transporter.sendMail({
      from: `"Turiticket" <${process.env.GMAIL_USER}>`,
      to: correo,
      subject: asunto,
      html,
    });

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error('Error enviando correo de permiso:', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
