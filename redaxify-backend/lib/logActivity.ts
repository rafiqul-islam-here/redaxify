import prisma from "@/configs/db.config";

type LogActivityParams = {
    activityType: string;
    description: string;
    status?: number;
    userAgent?: string;
    ipAddress?: string;
    latitude?: string;
    longitude?: string;
    customerNumber?: number;  // optional now
};

export async function logActivity({
    activityType,
    description,
    status,
    userAgent,
    ipAddress,
    latitude,
    longitude,
    customerNumber,
}: LogActivityParams) {
    try {
        let user = null;

        if (customerNumber) {
            user = await prisma.users.findUnique({
                where: { customerNumber },
                select: {
                    name: true,
                    email: true,
                },
            });
        }
        if (!user) {
            console.warn("User not found for activity log");
            return;
        }

        const result = await prisma.activity.create({
            data: {
                userName: user.name,
                email: user.email,
                activityType,
                description,
                timeStamp: new Date(),
                status,
                userAgent,
                ipAddress,
                latitute: latitude,
                longitute: longitude,
            },
        });
        //console.log("Activity logged successfully:", result);
    } catch (error) {
        console.error("Activity log failed:", error);
    }
}
