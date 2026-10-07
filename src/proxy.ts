import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { UserPayload } from 'next-auth';

export default auth((req) => {
  const response = NextResponse.next();
  
  const locale = req.cookies.get('NEXT_LOCALE');
  if (!locale) {
    response.cookies.set('NEXT_LOCALE', 'vi', { path: '/' });
  }

  const { pathname } = req.nextUrl;
  const authPages = ['/login', '/register', '/verify-account', '/banned'];
  const session = req.auth;

  if (session && session.user) {
    const user = session.user as UserPayload;
    const isVerified = user.isVerified;
    const isActive = user.isActive;
    if(!isActive)
    {
      if(!pathname.startsWith('/banned'))
      {
        return NextResponse.redirect(new URL("/banned", req.url));
      }
    }
    else if(!isVerified)
    {
      if(!pathname.startsWith('/verify-account'))
      { 
        return NextResponse.redirect(new URL(`/verify-account/${user.id}`, req.url));
      }
    }
    else if (authPages.some(page => pathname.startsWith(page))) {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }
  else
  {
    const protectedPages = ['/verify-account', '/banned'];
    if(protectedPages.some(page => pathname.startsWith(page)))
    { 
      return NextResponse.redirect(new URL('/login', req.url));
    }
  }
  
  return response;
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico|images).*)'],
};
