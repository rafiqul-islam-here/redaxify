import { PrismaClient } from "@prisma/client";
import { Adapter, AdapterUser, AdapterAccount } from "next-auth/adapters";

// Define input types to prevent 'any' warnings
interface CreateUserInput {
  email: string;
  name?: string;
}

interface AccountInput {
  provider: string;
  providerAccountId: string;
}

interface UpdateUserInput {
  id: string;
  name?: string | null;
  email?: string | null;
}


// Create a custom adapter
export function CustomPrismaAdapter(prisma: PrismaClient): Adapter {
  return {
    // Create a user
    async createUser(data: CreateUserInput) {
      // Generate a unique customer number (you may need to adjust this logic)
      const highestCustomer = await prisma.users.findFirst({
        orderBy: { customerNumber: "desc" },
      });
      const customerNumber = highestCustomer
        ? highestCustomer.customerNumber + 1
        : 1000;

      const user = await prisma.users.create({
        data: {
          email: data.email,
          name: data.name || "",
          customerNumber,
          provider: "google",
          userAuth: true,
        },
      });

      return {
        id: String(user.id),
        email: user.email,
        name: user.name,
        emailVerified: null,
        image: null,
      };
    },

    // Get user by ID
    async getUser(id: string): Promise<AdapterUser | null> {
      const user = await prisma.users.findUnique({
        where: { id: parseInt(id) },
      });

      if (!user) return null;

      return {
        id: String(user.id),
        email: user.email,
        name: user.name,
        emailVerified: null,
        image: null,
      };
    },

    // Get user by email
    async getUserByEmail(email: string): Promise<AdapterUser | null> {
      const user = await prisma.users.findUnique({
        where: { email },
      });

      if (!user) return null;

      return {
        id: String(user.id),
        email: user.email,
        name: user.name,
        emailVerified: null,
        image: null,
      };
    },

    // Get user by account
    async getUserByAccount({ provider, providerAccountId }: AccountInput): Promise<AdapterUser | null> {
      const user = await prisma.users.findFirst({
        where: {
          provider,
          providerId: providerAccountId,
        },
      });

      if (!user) return null;

      return {
        id: String(user.id),
        email: user.email,
        name: user.name,
        emailVerified: null,
        image: null,
      };
    },

    // Update user
    async updateUser(user: UpdateUserInput): Promise<AdapterUser> {
      const updatedUser = await prisma.users.update({
        where: { id: parseInt(user.id) },
        data: {
          name: user.name ?? undefined,
          email: user.email ?? undefined,
        },
      });

      return {
        id: String(updatedUser.id),
        email: updatedUser.email,
        name: updatedUser.name,
        emailVerified: null,
        image: null,
      };
    },

    // Link account to user
    async linkAccount({ userId, provider, providerAccountId, type, ...rest }: AdapterAccount): Promise<AdapterAccount> {
      await prisma.users.update({
        where: { id: parseInt(userId) },
        data: {
          provider,
          providerId: providerAccountId,
        },
      });

      return {
        id: userId,
        userId,
        type,
        provider,
        providerAccountId,
        ...rest,
      };
    },

    // These methods are required by the adapter interface but won't be fully functional
    // with your current schema. Implement them as no-ops or with limited functionality.
    async createSession() {
      return null!;
    },
    async getSessionAndUser() {
      return null;
    },
    async updateSession() {
      return null;
    },
    async deleteSession() {},
    async createVerificationToken() {
      return null;
    },
    async useVerificationToken() {
      return null;
    },
    async deleteUser() {},
    async unlinkAccount() {},
  };
}
