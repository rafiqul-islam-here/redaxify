import { NextRequest } from "next/server";
import jwt from "jsonwebtoken";

export const getAuthUser = (req: Request) => {
    try {
        const cookieHeader = req.headers.get("cookie") || "";
        const token = cookieHeader
            .split(";")
            .find(c => c.trim().startsWith("token="))
            ?.split("=")[1];

        if (!token) return null;

        const decoded = jwt.verify(token, process.env.TOKEN_SECRET!);
        if (typeof decoded === "object" && decoded !== null) {
            return decoded as {
                id: number;
                customerNumber: string;
                email?: string;
                name?: string;
            };
        }

        return null;
    } catch (err) {
        return null;
    }
};
