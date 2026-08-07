import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const { to, nombre, categoria, link } = await req.json()

    if (!to || !link) {
      return NextResponse.json({ error: 'Faltan datos' }, { status: 400 })
    }

    const apiKey = process.env.RESEND_API_KEY
    const from = process.env.RESEND_FROM || 'Turiticket <notificaciones@turiticket.com>'

    if (!apiKey) {
      return NextResponse.json({ error: 'RESEND_API_KEY no configurado' }, { status: 500 })
    }

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

    const resp = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from,
        to: [to],
        subject: 'Turiticket — Tienes un aviso pendiente de firma',
        html,
      }),
    })

    if (!resp.ok) {
      const errText = await resp.text()
      return NextResponse.json({ error: errText }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (err: any) {
    return NextResponse.json({ error: err?.message || 'Error desconocido' }, { status: 500 })
  }
}

