import FirmarClient from './FirmarClient'

export default async function FirmarPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params
  return <FirmarClient token={token} />
}

