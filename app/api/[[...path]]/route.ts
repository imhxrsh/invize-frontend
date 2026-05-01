import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'

/** Read BACKEND_URL on every request (not at build time like rewrites). */
export const dynamic = 'force-dynamic'
export const fetchCache = 'force-no-store'

const HOP_BY_HOP_REQ = new Set([
  'connection',
  'keep-alive',
  'proxy-authenticate',
  'proxy-authorization',
  'te',
  'trailer',
  'transfer-encoding',
  'upgrade',
  'host',
])

const HOP_BY_HOP_RES = new Set(['connection', 'keep-alive', 'transfer-encoding'])

function backendBase(): string {
  const raw = process.env.BACKEND_URL?.trim()
  if (!raw) return 'http://127.0.0.1:8000'
  return raw.replace(/\/$/, '')
}

function targetUrl(req: NextRequest, segments: string[]): string {
  const base = backendBase()
  const path = segments.map((s) => encodeURIComponent(s)).join('/')
  const q = req.nextUrl.search
  return path ? `${base}/${path}${q}` : `${base}${q}`
}

function forwardRequestHeaders(headers: Headers): Headers {
  const out = new Headers()
  headers.forEach((value, key) => {
    if (HOP_BY_HOP_REQ.has(key.toLowerCase())) return
    out.append(key, value)
  })
  return out
}

function forwardResponseHeaders(upstream: Headers): Headers {
  const out = new Headers()
  upstream.forEach((value, key) => {
    const lower = key.toLowerCase()
    if (lower === 'set-cookie') return
    if (HOP_BY_HOP_RES.has(lower)) return
    out.append(key, value)
  })
  const multi =
    typeof upstream.getSetCookie === 'function' ? upstream.getSetCookie() : []
  if (multi.length) {
    for (const c of multi) out.append('set-cookie', c)
  } else {
    const single = upstream.get('set-cookie')
    if (single) out.append('set-cookie', single)
  }
  return out
}

async function proxy(req: NextRequest, segments: string[]): Promise<Response> {
  const url = targetUrl(req, segments)
  const method = req.method
  const init: RequestInit & { duplex?: 'half' } = {
    method,
    headers: forwardRequestHeaders(req.headers),
    redirect: 'manual',
    cache: 'no-store',
  }
  if (!['GET', 'HEAD'].includes(method) && req.body) {
    init.body = req.body
    init.duplex = 'half'
  }

  let res: Response
  try {
    res = await fetch(url, init)
  } catch (e) {
    const message = e instanceof Error ? e.message : 'Upstream fetch failed'
    return NextResponse.json({ detail: message }, { status: 502 })
  }

  return new NextResponse(res.body, {
    status: res.status,
    statusText: res.statusText,
    headers: forwardResponseHeaders(res.headers),
  })
}

type RouteCtx = { params: { path?: string[] } }

export function GET(req: NextRequest, ctx: RouteCtx) {
  return proxy(req, ctx.params.path ?? [])
}

export function POST(req: NextRequest, ctx: RouteCtx) {
  return proxy(req, ctx.params.path ?? [])
}

export function PUT(req: NextRequest, ctx: RouteCtx) {
  return proxy(req, ctx.params.path ?? [])
}

export function PATCH(req: NextRequest, ctx: RouteCtx) {
  return proxy(req, ctx.params.path ?? [])
}

export function DELETE(req: NextRequest, ctx: RouteCtx) {
  return proxy(req, ctx.params.path ?? [])
}

export function OPTIONS(req: NextRequest, ctx: RouteCtx) {
  return proxy(req, ctx.params.path ?? [])
}

export function HEAD(req: NextRequest, ctx: RouteCtx) {
  return proxy(req, ctx.params.path ?? [])
}
