import prismadb from "@/configs/db.config";

export const generateCustomerNumber = async (): Promise<number> => {
  const lastUser = await prismadb.users.findFirst({
    orderBy: { customerNumber: "desc" },
  });

  return lastUser ? lastUser.customerNumber + 1 : 1000;
};
