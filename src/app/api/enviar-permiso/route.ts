import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  try {
    const { to, nombre, aprobado, tipoPermisoLabel, fecha, comentario } = await req.json()

    if (!to) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    }

    const gmailUser = process.env.GMAIL_USER
    const gmailPass = process.env.GMAIL_APP_PASSWORD

    if (!gmailUser || !gmailPass) {
      return NextResponse.json({ error: 'GMAIL_USER o GMAIL_APP_PASSWORD no configurados' }, { status: 500 })
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: { user: gmailUser, pass: gmailPass },
    })

    const colorEstado = aprobado ? '#16a34a' : '#dc2626'
    const textoEstado = aprobado ? 'APROBADA ✅' : 'RECHAZADA ❌'

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color:#1f2937;">
        <h2 style="color:#4f46e5;">Turiticket Operaciones</h2>
        <p>Hola ${nombre || ''},</p>
        <p>Tu solicitud de permiso (<strong>${tipoPermisoLabel || ''}</strong>, ${fecha || ''}) fue:</p>
        <p style="font-size:18px; font-weight:bold; color:${colorEstado};">${textoEstado}</p>
        ${comentario ? `<p style="font-size:14px; color:#374151;"><strong>Comentario:</strong> ${comentario}</p>` : ''}
        <p style="font-size:12px; color:#6b7280; margin-top:24px;">Este es un correo automático de Turiticket Operaciones.</p>
      </div>
    `

    await transporter.sendMail({
      from: `"Turiticket" <${gmailUser}>`,
      to,
      subject: `Turiticket — Tu solicitud de permiso fue ${aprobado ? 'aprobada' : 'rechazada'}`,
      html,
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error desconocido' }, { status: 500 })
  }
}

