import { NextRequest, NextResponse } from 'next/server'
import nodemailer from 'nodemailer'

export async function POST(req: NextRequest) {
  try {
    const { to, nombre, categoria, link } = await req.json()

    if (!to || !link) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    }

    const gmailUser = process.env.GMAIL_USER
    const gmailPass = process.env.GMAIL_APP_PASSWORD

    if (!gmailUser || !gmailPass) {
      return NextResponse.json({ error: 'GMAIL_USER o GMAIL_APP_PASSWORD no configurados' }, { status: 500 })
    }

    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: gmailUser,
        pass: gmailPass,
      },
    })

    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; color:#1f2937;">
        <h2 style="color:#4f46e5;">Turiticket Operaciones</h2>
        <p>Hola ${nombre || ''},</p>
        <p>Tienes un aviso pendiente de revisar y firmar (<strong>${categoria || 'registro'}</strong>).</p>
        <p style="margin: 24px 0;">
          <a href="${link}" style="background:#4f46e5; color:#fff; padding:12px 20px; border-radius:8px; text-decoration:none; font-weight:bold;">
            Ver y firmar
          </a>
        </p>
        <p style="font-size:12px; color:#6b7280;">Si el botón no funciona, copia y pega este link en tu navegador:<br>${link}</p>
      </div>
    `

    await transporter.sendMail({
      from: `"Turiticket" <${gmailUser}>`,
      to,
      subject: 'Turiticket — Tienes un aviso pendiente de firma',
      html,
    })

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error desconocido' }, { status: 500 })
  }
}