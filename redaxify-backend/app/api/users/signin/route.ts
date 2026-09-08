import bcryptjs from "bcryptjs";
import { SignJWT } from "jose";
import { NextRequest, NextResponse } from "next/server";
// import { setCorsHeaders } from "@/lib/cors";
import prismadb from "@/configs/db.config";

// export async function OPTIONS() {
//   const res = new NextResponse(null, { status: 204 });
//   setCorsHeaders(res);
//   return res;
// }

export async function POST(request: NextRequest) {
  try {
    const reqBody = await request.json();
    const { email, password } = reqBody;

    const user = await prismadb.users.findUnique({ where: { email } });

    if (!user) {
      const res = NextResponse.json(
        { error: "User does not exist" },
        { status: 400 }
      );
      // setCorsHeaders(res);
      return res;
    }

    if (!user.userAuth) {
      const res = NextResponse.json(
        { error: "User is not Verified" },
        { status: 400 }
      );
      // setCorsHeaders(res);
      return res;
    }

    const validPassword =
      user.password && (await bcryptjs.compare(password, user.password));

    if (!validPassword) {
      try {
        // Log activity directly to database instead of HTTP call
        await prismadb.activity.create({
          data: {
            email: user.email,
            userName: user.name,
            activityType: "Sign In",
            description: "User Sign In Failed, Invalid password",
            timeStamp: new Date(),
            status: 400,
          },
        });
      } catch (error) {
        console.error("Failed to log activity:", error);
      }

      const res = NextResponse.json(
        { error: "Invalid password" },
        { status: 400 }
      );
      // setCorsHeaders(res);
      return res;
    }

    const tokenData = {
      id: user.id,
      name: user.name,
      email: user.email,
      userRole: user.userRole,
      userType: user.userType,
    };

    const SECRET_KEY = new TextEncoder().encode(process.env.TOKEN_SECRET);
    const token = await new SignJWT(tokenData)
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime("1d")
      .sign(SECRET_KEY);

    const response = NextResponse.json({
      message: "Login successful",
      success: true,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        provider: user.provider,
        providerId: user.providerId,
        userType: user.userType,
        userAuth: user.userAuth,
        userRole: user.userRole,
      },
    });

    response.headers.set("Set-Cookie", [
      `token=${token}`,
      `Path=/`,
      `HttpOnly`,
      `Secure`,
      `SameSite=None`,
      `Max-Age=86400`,
    ].join("; "));

    // sameSite: "lax",
    // const isProd = process.env.NODE_ENV === "production";
    // response.cookies.set("token", token, {
    //   httpOnly: true,
    //   secure: isProd,
    //   sameSite: isProd ? "none":"lax",
    //   maxAge: 24 * 60 * 60,
    //   path: "/",
    // });

    // Log successful signin activity directly to database
    try {
      prismadb.activity.create({
        data: {
          email: user.email,
          userName: user.name,
          activityType: "Sign In",
          description: "User Sign In",
          timeStamp: new Date(),
          status: 200,
        },
      });
    } catch (error) {
      console.error("Failed to log activity:", error);
    }

    // setCorsHeaders(response);
    return response;
  } catch (error) {
    console.error("Error in login:", error);
    const res = NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "An unknown error occurred",
      },
      { status: 500 }
    );
    // setCorsHeaders(res);
    return res;
  }
}
