import { getToken } from "next-auth/jwt";
import { NextRequest, NextResponse } from "next/server";

const authRoutes = ["/login", "/signup"];

const protectedRoutes = ["/dashboard", "/profile"];

export async function proxy(request: NextRequest) {
  try {
    const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET });
    const pathname = request.nextUrl.pathname;

    const role = (token?.role as string || "").toLowerCase();

    const isAuthRoute = authRoutes.includes(pathname);
    const isProtectedRoute = protectedRoutes.some((route) =>
      pathname === route || pathname.startsWith(route + "/"),
    );
    const isAdminApi = pathname.startsWith("/api/admin");
    const isAdminRoute = pathname.startsWith("/admin") && !isAdminApi;
    const isAdminLoginPage = pathname === "/admin/login";

    // Redirect logged-in users away from auth pages (login/signup)
    if (isAuthRoute && token) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }

    // Protect user routes (dashboard, profile)
    if (isProtectedRoute && !token) {
      return NextResponse.redirect(new URL("/login", request.url));
    }

    // Protect Admin API Endpoints
    if (isAdminApi) {
      if (!token) {
        return NextResponse.json(
          { error: "Unauthorized: Please log in" },
          { status: 401 }
        );
      }
      if (role !== "admin" && role !== "super_admin") {
        return NextResponse.json(
          { error: "Forbidden: Admins only" },
          { status: 403 }
        );
      }
    }

    // Protect Admin pages (all /admin/* except login)
    if (isAdminRoute && !isAdminLoginPage) {
      if (!token) {
        const loginUrl = new URL("/admin/login", request.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }
      if (role !== "admin" && role !== "super_admin") {
        return NextResponse.redirect(new URL("/dashboard", request.url));
      }
    }

    // Prevent logged-in users from accessing the admin login page
    if (isAdminLoginPage && token) {
      if (role === "admin" || role === "super_admin") {
        return NextResponse.redirect(new URL("/admin/dashboard", request.url));
      }
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
  } catch {
    // Allow request through if middleware fails
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/login",
    "/signup",
    "/profile/:path*",
    "/dashboard/:path*",
    "/admin/:path*",
    "/api/admin/:path*",
  ],
};
