import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

const ACCESS_COOKIE = 'invize_access_token'

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (pathname.startsWith('/dashboard')) {
    const token = req.cookies.get(ACCESS_COOKIE)?.value
    if (!token) {
      const url = req.nextUrl.clone()
      url.pathname = '/'
      url.searchParams.set('redirect', pathname)
      return NextResponse.redirect(url)
    }
  }

  // Ensure API proxy calls carry Bearer auth; cookie is same-origin to Next.
  if (pathname === '/api' || pathname.startsWith('/api/')) {
    const existing = req.headers.get('authorization')
    if (!existing) {
      const token = req.cookies.get(ACCESS_COOKIE)?.value
      if (token) {
        const requestHeaders = new Headers(req.headers)
        requestHeaders.set('Authorization', `Bearer ${token}`)
        return NextResponse.next({ request: { headers: requestHeaders } })
      }
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/dashboard/:path*', '/api', '/api/:path*'],
}
