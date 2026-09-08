// pages/api/dashboard/users.ts

import { NextResponse } from 'next/server';
import prismadb from '@/configs/db.config';

export async function GET() {
  try {
    // Fetch users from the database
    const users = await prismadb.users.findMany();

    return NextResponse.json(users, { status: 200 });
  } catch (error) {
    console.error('Error fetching users:', error);
    return NextResponse.json(
      { error: 'Error fetching users' },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const { userId, permission } = await req.json();

    // Find the user by ID
    const user = await prismadb.users.findUnique({
      where: { id: userId },
    });

    // If the user doesn't exist, return an error
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    // If the user role is 'admin', prevent the update
    if (user.userRole === 'admin') {
      return NextResponse.json(
        { error: 'Cannot update permissions for admin users' },
        { status: 403 }
      );
    }

    // Otherwise, update the user's permission status
    const updatedUser = await prismadb.users.update({
      where: { id: userId },
      data: { permission: permission },
    });

    // Respond with the updated user
    return NextResponse.json(updatedUser, { status: 200 });
  } catch (error) {
    console.error('Error updating user permission:', error);
    return NextResponse.json(
      { error: 'Error updating user permission' },
      { status: 500 }
    );
  }
}
