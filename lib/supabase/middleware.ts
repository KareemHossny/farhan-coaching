import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  // Never redirect or refresh auth cookies while Next is processing a Server
  // Action. The action response must remain an RSC response.
  const isServerAction = request.method === "POST" && request.headers.has("next-action");
  if (isServerAction) return NextResponse.next({ request });

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        },
      },
    },
  );

  let user = null;
  try {
    const result = await supabase.auth.getUser();
    user = result.data.user;
  } catch (error) {
    console.error("Supabase session check failed", error);
    // Public routes, especially /login, must still render when Auth is
    // temporarily unreachable. Protected routes are handled as signed out.
  }
  const pathname = request.nextUrl.pathname;
  const isProtected = pathname.startsWith("/coach") || pathname.startsWith("/dashboard");

  if (!user && isProtected) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .maybeSingle();
    const destination = profile?.role === "coach" ? "/coach" : "/dashboard";

    if (pathname === "/login") return NextResponse.redirect(new URL(destination, request.url));
    if (pathname.startsWith("/coach") && profile?.role !== "coach") {
      return NextResponse.redirect(new URL(destination, request.url));
    }
    if (pathname.startsWith("/dashboard") && profile?.role !== "client") {
      return NextResponse.redirect(new URL(destination, request.url));
    }
  }

  return response;
}
