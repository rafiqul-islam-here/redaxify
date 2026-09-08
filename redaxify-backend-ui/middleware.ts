import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const AUTH_ROUTES = [
  "/sign-in",
  "/sign-up",
  "/forget-password",
  "/reset-password",
  "/otp",
  "/verifyemail"
];

const PUBLIC_ROUTES = [
  "/subscriptions",
  "/about",
  "/contact",
  // in case of public routes add them here.
];

const ROLE_ALLOWED_DASHBOARD_ROUTES: Record<string, string[]> = {
  support: ["/dashboard", "/dashboard/support/feedbacks"],
  marketing: ["/dashboard", "/dashboard/support/feedbacks"],
};

const SECRET = new TextEncoder().encode(process.env.TOKEN_SECRET);

async function getUserFromToken(token: string) {
  try {
    const { payload } = await jwtVerify(token, SECRET);
    //console.log("Token payload:", payload);
    return payload;
  } catch (error) {
    console.error("Token verification failed:", error);
    return null;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  //console.log(" Middleware Started: .....................")
  const token = request.cookies.get("token")?.value;
  //console.log("Middleware token:", token);

  const isAuthRoute = AUTH_ROUTES.includes(pathname);
  const isPublicRoute = PUBLIC_ROUTES.includes(pathname);
  const isDashboardRoute = pathname.startsWith("/dashboard");

  // if the route is public, access is allowed
  if (isPublicRoute) {
    return NextResponse.next();
  }

  // if not authenticated and not in auth routes kick back to /sign-in
  if (!token && !isAuthRoute) {
    return NextResponse.redirect(new URL("/sign-in", request.url));
  }

  // if token is there verify it
  if (token) {
    const user = await getUserFromToken(token);
    if (!user) {
      return NextResponse.redirect(new URL("/sign-in", request.url));
    }

    const role = user.userRole as string;

    // restricts authenticated users from accessing auth routes
    if (isAuthRoute) {
      return NextResponse.redirect(new URL("/", request.url));
    }

    // dashboard route restriction based on userRole
    if (isDashboardRoute) {
      if (role === "user") {
        // users can't access dashboard routes
        return NextResponse.redirect(new URL("/", request.url));
      }

      if (role === "support" || role === "marketing") {
        const allowedRoutes = ROLE_ALLOWED_DASHBOARD_ROUTES[role];
        const isAllowed = allowedRoutes.some(route => pathname === route || pathname.startsWith(route + "/"));

        if (!isAllowed) {
          return NextResponse.redirect(new URL("/", request.url));
        }
      }
    }
  }

  // everything is allowed.
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|api|assets|icons).*)",
  ],
};


// Written By Faisal Ahmed (not removed just in case you need it later)
// import { NextRequest, NextResponse } from "next/server";
// import { jwtVerify } from "jose";
// import { getToken } from "next-auth/jwt";

// const SECRET_KEY = new TextEncoder().encode(process.env.TOKEN_SECRET);

// export async function middleware(req: NextRequest) {
//   const token = req.cookies.get("token")?.value || "";
//   const session = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
//   const path = req.nextUrl.pathname;
//   const { pathname } = req.nextUrl;
//   let userRole: string = "user";

//   if (token) {
//     try {
//       const { payload } = await jwtVerify(token, SECRET_KEY);
//       userRole = payload.userRole as string;
//     } catch (error) {
//       console.error("Invalid Token:", error);
//     }
//   } else if (session) {
//     console.log("Session:", session);

//     // Try getting role from session
//     // userRole = (session as any).userRole || null;
//     userRole = "user";

//     // Fetch from database if session does not include userRole
//     // if (!userRole && session.userId) {
//     //   try {
//     //     const user = await prisma.users.findUnique({
//     //       where: { id: session.userId },
//     //       select: { userRole: true },
//     //     });
//     //     console.log(user);
//     //     userRole = user?.userRole || "user"; // Default to "user"
//     //   } catch (error) {
//     //     console.error("Error fetching user role:", error);
//     //   }
//     // }
//   }
//   console.log("Role", userRole);

//   // const isPublicpath =
//   //   path === "/sign-up" ||
//   //   path === "/sign-in" ||
//   //   path === "/otp" ||
//   //   path === "/reset-password" ||
//   //   path === "/verifyemail" ||
//   //   path === "/forget-password";

//   // Define public routes
//   const publicPaths = [
//     "/sign-up",
//     "/sign-in",
//     "/otp",
//     "/reset-password",
//     "/verifyemail",
//     "/forget-password",
//   ];

//   // Define role-based protected routes
//   const roleProtectedPaths = {
//     admin: [
//       "/dashboard/billing/coupons",
//       "/dashboard/billing/billing-settings",
//       "/dashboard/billing/payment-history",
//       "/dashboard/users/user-management",
//       "/dashboard/users/permissions",
//       "/dashboard/users/activity-log",
//       "/dashboard/users/folders",
//       "/dashboard/users/users",
//     ],
//     user: ["/", "/video"],
//     marketing: ["/dashboard/support/feedbacks", "/dashboard"],
//     support: ["/dashboard/support/feedbacks", "/dashboard"],
//   };

//   const isPublicPath = publicPaths.includes(pathname);
//   const isAdminRoute = roleProtectedPaths.admin.includes(pathname);
//   const isUserRoute = roleProtectedPaths.user.includes(pathname);
//   const isSupportRoute = roleProtectedPaths.support.includes(pathname);
//   const isMarketingRoute = roleProtectedPaths.marketing.includes(pathname);

//   if (!token && !session && !isPublicPath) {
//     if (path !== "/sign-in") {
//       return NextResponse.redirect(new URL("/sign-in", req.url));
//     }
//   }
//   if ((token || session) && isPublicPath) {
//     return NextResponse.redirect(new URL("/", req.url));
//   }
//   // Role-based access control

//   // Admin Can Acces All Role
//   if (isAdminRoute && userRole !== "admin") {
//     return NextResponse.redirect(new URL("/unauthorized", req.url));
//   }
//   if (
//     isSupportRoute &&
//     userRole !== "support" &&
//     userRole !== "admin" &&
//     userRole !== "marketing"
//   ) {
//     return NextResponse.redirect(new URL("/unauthorized", req.url));
//   }
//   if (
//     isMarketingRoute &&
//     userRole !== "marketing" &&
//     userRole !== "admin" &&
//     userRole !== "support"
//   ) {
//     return NextResponse.redirect(new URL("/unauthorized", req.url));
//   }

//   // now Admin User Marketing and Suport acess user role ❌❌❌  TODO Change role
//   if (
//     isUserRoute &&
//     userRole !== "user" &&
//     userRole !== "admin" &&
//     userRole !== "marketing" &&
//     userRole !== "support"
//   ) {
//     return NextResponse.redirect(new URL("/unauthorized", req.url));
//   }

//   return NextResponse.next();
// }

// export const config = {
//   // matcher: ["/:path*"], // paths added here will be protected.
//   matcher: [
//     "/",
//     "/sign-up",
//     "/sign-in",
//     "/otp",
//     "/verifyemail",
//     "/forget-password",
//     "/reset-password",
//     "/video",
//     "/video/:path*",
//     "/dashboard",
//     "/dashboard/billing/coupons",
//     "/dashboard/billing/billing-settings",
//     "/dashboard/billing/payment-history",
//     "/dashboard/users/users",
//     "/dashboard/users/user-management",
//     "/dashboard/users/permissions",
//     "/dashboard/users/activity-log",
//     "/dashboard/users/folders",
//     "/dashboard/support/feedbacks",
//   ], // paths added here will be protected.
// };
