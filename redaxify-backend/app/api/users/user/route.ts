import { NextRequest, NextResponse } from "next/server";
import { getDataFromToken } from "@/utils/getDataFromToken";
import prisma from "@/lib/prisma";

export async function GET(request: NextRequest) {
  try {
    // extract user ID from the request token
    const userId = await getDataFromToken(request);

    if (!userId) {
      return NextResponse.json({ message: "User not authenticated" }, { status: 401 });
    }

  
    const user = await prisma.users.findUnique({
      where: { id: userId },
      omit: {
        password: true,
        otp: true,
        otpExpires: true,
        mailVerifytoken: true,
        mailVerifytokenExpires: true,
      },
    });

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 });
    }

    return NextResponse.json({
      message: "User found",
      data: user,
    });
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error in GET /api/users:", error.message);
      return NextResponse.json({ error: error.message }, { status: 400 });
    }
    return NextResponse.json({ error: "Unknown error" }, { status: 400 });
  }
}


// import { NextRequest, NextResponse } from "next/server";
// import { getDataFromToken } from "@/utils/getDataFromToken";
// import prisma from "@/lib/prisma";

// export async function GET(request: NextRequest) {
//   try {
//     const userId = await getDataFromToken(request);
//     const user = await prisma.users.findUnique({
//       where: { id: userId },
//       omit: {
//         password: true,
//         otp: true,
//         otpExpires: true,
//         mailVerifytoken: true,
//         mailVerifytokenExpires: true,
//       },
//     });

//     if (!user) {
//       return NextResponse.json({ message: "User not found" }, { status: 404 });
//     }

//     return NextResponse.json({
//       message: "User found",
//       data: user,
//     });
//   } catch (error: any) {
//     return NextResponse.json({ error: error.message }, { status: 400 });
//   }
// }

// import { NextRequest, NextResponse } from "next/server";
// import { getDataFromToken } from "@/utils/getDataFromToken";
// import prisma from "@/lib/prisma";
// import { getServerSession } from "next-auth";
// import { authOptions } from "../../auth/[...nextauth]/route";

// export async function GET(request: NextRequest) {
//   try {
//     let userId: number | undefined = undefined;
//     let user = null;

//     // this is to check if user id is there if so that means user is logged in using email password not social media login
//     try {
//       userId = await getDataFromToken(request);
//     } catch (error) {
//       console.log("No valid JWT token found");
//       console.log(error);
//     }

//     if (userId) {
//       user = await prisma.users.findUnique({
//         where: { id: userId },
//         omit: {
//           password: true,
//           otp: true,
//           otpExpires: true,
//           mailVerifytoken: true,
//           mailVerifytokenExpires: true,
//         },
//       });
//     }

//     // if JWT is not found in that case need to check if session is available this was for google but it's no longer in frontend.
//     if (!user) {
//       const session = await getServerSession(authOptions);
//       if (session?.user?.email) {
//         user = await prisma.users.findUnique({
//           where: { email: session.user.email }, // check by email if using Google Auth
//           omit: {
//             password: true,
//             otp: true,
//             otpExpires: true,
//             mailVerifytoken: true,
//             mailVerifytokenExpires: true,
//           },
//         });
//       }
//     }

//     // if user is not found just return a proper error that user is not found
//     if (!user) {
//       return NextResponse.json({ message: "User not found" }, { status: 404 });
//     }

//     return NextResponse.json({
//       message: "User found",
//       data: user,
//     });
//   } catch (error: unknown) {
//     if (error instanceof Error) {
//       console.log("No valid JWT token found");
//       console.log(error.message);
  
//       return NextResponse.json({ error: error.message }, { status: 400 });
//     } else {
//       console.log("An unknown error occurred"); 
//       // Returns a generic error response
//       return NextResponse.json({ error: "An unknown error occurred" }, { status: 400 });
//     }
//   }
// }
