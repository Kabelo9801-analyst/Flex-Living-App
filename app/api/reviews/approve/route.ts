import { NextRequest, NextResponse } from 'next/server'
import fs from 'node:fs/promises'
import path from 'node:path'
import { Redis } from '@upstash/redis'

const STORE = path.join(process.cwd(), 'data', 'approved.json')

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
})

export async function PATCH(req: Request) {
  const { id, approved } = await req.json()
  await redis.set(id, approved)
  return Response.json({ ok: true })
}

