import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'

const STORE = path.join(process.cwd(), 'data', 'approved.json')

export async function PATCH(req: NextRequest) {
  const body = await req.json().catch(()=>null) as { id: string; approved: boolean } | null
  if (!body?.id) return NextResponse.json({ ok: false, error: 'Missing id' }, { status: 400 })
  try {
    let current: Record<string, boolean> = {}
    try {
      current = JSON.parse(await fs.readFile(STORE, 'utf-8'))
    } catch {}
    current[body.id] = !!body.approved
    await fs.writeFile(STORE, JSON.stringify(current, null, 2))
    return NextResponse.json({ ok: true })
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 })
  }
}
