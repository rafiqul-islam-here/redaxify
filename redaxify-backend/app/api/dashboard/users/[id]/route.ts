import { NextResponse } from 'next/server';
import prismadb from '@/configs/db.config';

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    const { userRole } = await request.json();

    // Validate userRole before updating
    const validRoles = ["user", "admin", "support", "marketing"];
    if (!validRoles.includes(userRole)) {
      return NextResponse.json(
        { error: 'Invalid user role' },
        { status: 400 }
      );
    }

    // Check if the user is an admin before updating
    const existingUser = await prismadb.users.findUnique({
      where: { id: Number(id) },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (existingUser.userRole === "admin") {
      return NextResponse.json(
        { error: 'Admin user cannot be modified' },
        { status: 403 }
      );
    }

    // Update the user's role
    const updatedUser = await prismadb.users.update({
      where: { id: Number(id) },
      data: { userRole },
    });

    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error: unknown) {
    console.error('Error updating user:', error);

    return NextResponse.json(
      { error: 'Error updating user' },
      { status: 500 }
    );
  }
}


// export async function DELETE(request: Request, { params }: { params: { id: string } }) {
//   try {
//     const { id } = await params;

//     if (!id) {
//       return NextResponse.json(
//         { error: 'User ID is required' },
//         { status: 400 }
//       );
//     }

//     // Check if the user is an admin before deleting
//     const existingUser = await prismadb.users.findUnique({
//       where: { id: Number(id) },
//       include: {
//         subscriptions: true,
//         // Include other relations if needed
//       }
//     });

//     if (!existingUser) {
//       return NextResponse.json({ error: 'User not found' }, { status: 404 });
//     }

//     if (existingUser.userRole === "admin") {
//       return NextResponse.json(
//         { error: 'Admin user cannot be deleted' },
//         { status: 403 }
//       );
//     }
    
//     // First delete all related subscriptions
//     await prismadb.subscription.deleteMany({
//       where: { userId: Number(id) }
//     });


//     // Delete the user by ID
//     const deletedUser = await prismadb.users.delete({
//       where: { id: Number(id) },
//     });

//     return NextResponse.json(deletedUser, { status: 200 });
//   } catch (error: unknown) {
//     console.error('Error deleting user:', error);

//     return NextResponse.json(
//       { error: 'Error deleting user' },
//       { status: 500 }
//     );
//   }
// }

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = await params;

    if (!id) {
      return NextResponse.json(
        { error: 'User ID is required' },
        { status: 400 }
      );
    }

    // user exists and is not admin
    const existingUser = await prismadb.users.findUnique({
      where: { id: Number(id) },
    });

    if (!existingUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    if (existingUser.userRole === "admin") {
      return NextResponse.json(
        { error: 'Admin user cannot be deleted' },
        { status: 403 }
      );
    }

    // first delete all related records in the correct order
    await prismadb.$transaction([
      // coupon usages first (many to many)
      prismadb.couponUsage.deleteMany({
        where: { userId: Number(id) }
      }),

      // then bills (references customerNumber)
      prismadb.bill.deleteMany({
        where: { customerNumber: existingUser.customerNumber }
      }),

      // and then subscriptions
      prismadb.subscription.deleteMany({
        where: { userId: Number(id) }
      }),

      // and then folders and their contents
      prismadb.video.deleteMany({
        where: { customerNumber: existingUser.customerNumber }
      }),
      prismadb.image.deleteMany({
        where: { customerNumber: existingUser.customerNumber }
      }),
      prismadb.folder.deleteMany({
        where: { customerNumber: existingUser.customerNumber }
      }),

      // finally delete the user
      prismadb.users.delete({
        where: { id: Number(id) }
      })
    ]);

    return NextResponse.json({ message: 'User deleted successfully' }, { status: 200 });
  } catch (error: unknown) {
    console.error('Error deleting user:', error);

    return NextResponse.json(
      { error: 'Error deleting user. Please try again.' },
      { status: 500 }
    );
  }
}

  
