import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  try {
    // 添加安全相关的响应头
    const response = NextResponse.next();
    
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set(
      'Content-Security-Policy',
      "default-src 'self' 'unsafe-inline' 'unsafe-eval' *.u-tools.fun *.douyin.com *.douyinpic.com *.gtimg.cn *.unsplash.com *.splitbee.io unpkg.com; img-src 'self' data: blob: *.u-tools.fun *.douyin.com *.douyinpic.com *.gtimg.cn *.unsplash.com; media-src 'self' *.u-tools.fun *.douyin.com *.douyinpic.com *.gtimg.cn;"
    );

    return response;
  } catch (error) {
    console.error('Middleware error:', error);
    return new NextResponse(
      JSON.stringify({ success: false, message: 'Internal Server Error' }),
      { status: 500, headers: { 'content-type': 'application/json' } }
    );
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}; 