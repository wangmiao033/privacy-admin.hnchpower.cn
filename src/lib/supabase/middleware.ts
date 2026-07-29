import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

const ALLOWED_ADMIN_EMAIL = "wangmiao@dxyx6888.com";

const PROTECTED_PREFIXES = [
  "/dashboard",
  "/users",
  "/stats",
  "/visits",
  "/policies",
  "/settings",
];

function isAllowedAdminEmail(email: string | null | undefined) {
  return String(email || "").trim().toLowerCase() === ALLOWED_ADMIN_EMAIL;
}

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    return supabaseResponse;
  }

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({
          request: {
            headers: request.headers,
          },
        });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = request.nextUrl.pathname;
  const isAllowedUser = !!user && isAllowedAdminEmail(user.email);

  if (path.startsWith("/login")) {
    if (isAllowedUser) {
      return NextResponse.redirect(new URL("/dashboard", request.url));
    }
    return supabaseResponse;
  }

  const isProtected = PROTECTED_PREFIXES.some(
    (p) => path === p || path.startsWith(`${p}/`)
  );

  if (isProtected && !user) {
    const login = new URL("/login", request.url);
    login.searchParams.set("next", path);
    return NextResponse.redirect(login);
  }

  if (isProtected && !isAllowedUser) {
    return NextResponse.redirect(new URL("/no-access", request.url));
  }

  return supabaseResponse;
}
