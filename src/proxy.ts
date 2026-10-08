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
  const adminPath = pathname === "/admin" || pathname.startsWith("/admin/");

  if (adminPath) {
    if (!session?.user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    const role = session.user.role;
    const allowedRoles = ["SuperAdmin", "Admin", "Manager", "Delivery", "Staff"];
    if (!role || !allowedRoles.includes(role)) {
      return NextResponse.redirect(new URL("/", req.url));
    }

    const restrictedPrefixes: Record<string, string[]> = {
      Delivery: ["/admin/orders"],
      Staff: ["/admin/products", "/admin/brands", "/admin/categories", "/admin/orders", "/admin/reviews", "/admin/warranties"],
      Manager: ["/admin/products", "/admin/brands", "/admin/categories", "/admin/orders", "/admin/payments", "/admin/refunds", "/admin/staff", "/admin/customers", "/admin/vouchers", "/admin/reviews", "/admin/warranties", "/admin/locations", "/admin/audit-logs", "/admin/reports"],
    };
    const roleAllowedPaths = restrictedPrefixes[role];
    if (roleAllowedPaths && pathname !== "/admin" && !roleAllowedPaths.some((prefix) => pathname.startsWith(prefix))) {
      return NextResponse.redirect(new URL("/admin", req.url));
    }
  }

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
