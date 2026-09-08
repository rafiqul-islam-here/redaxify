import { PrismaClient } from '@prisma/client';
import { NextResponse } from 'next/server';

const prisma = new PrismaClient();

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get('type');

    try {
        switch (type) {
            case 'users':
                const users = await prisma.users.findMany({
                    select: {
                        id: true,
                        customerNumber: true,
                        name: true,
                        email: true,
                        password: true,
                        provider: true,
                        providerId: true,
                        userType: true,
                        userAuth: true,
                        permission: true,
                        userRole: true,
                        otp: true,
                        otpExpires: true,
                        mailVerifytoken: true,
                        mailVerifytokenExpires: true,
                        createdAt: true,
                    },
                });
                return NextResponse.json(users, { status: 200 });

            case 'video-stats':
                const videos = await prisma.video.findMany({
                    select: {
                        videoDuration: true,
                    },
                });
                const totalVideoUploaded = videos.length;
                const totalDurationSeconds = videos.reduce((sum, video) => sum + video.videoDuration, 0);
                const totalDurationMinutes = Math.round(totalDurationSeconds / 60);
                return NextResponse.json({
                    totalVideoUploaded,
                    totalDurationMinutes,
                    totalDurationSeconds,
                }, { status: 200 });

            case 'subscription-stats':
                const subscriptions = await prisma.subscription.findMany({
                    select: {
                        status: true,
                    },
                });
                const totalActive = subscriptions.filter(sub => sub.status === 'ACTIVE').length;
                const totalTrial = subscriptions.filter(sub => sub.status === 'TRIAL').length;
                const totalCanceled = subscriptions.filter(sub => sub.status === 'CANCELED').length;
                const totalExpired = subscriptions.filter(sub => sub.status === 'EXPIRED').length;
                return NextResponse.json({
                    totalActive,
                    totalTrial,
                    totalCanceled,
                    totalExpired,
                }, { status: 200 });

            case 'coupon-stats':
                const coupons = await prisma.coupon.findMany({
                    select: {
                        isActive: true,
                        usages: {
                            select: {
                                timesUsed: true,
                            },
                        },
                    },
                });
                const totalCoupons = coupons.length;
                const activeCoupons = coupons.filter(coupon => coupon.isActive).length;
                const totalUsages = coupons.reduce((sum, coupon) =>
                    sum + coupon.usages.reduce((usageSum, usage) => usageSum + usage.timesUsed, 0), 0);
                return NextResponse.json({
                    totalCoupons,
                    activeCoupons,
                    totalUsages,
                }, { status: 200 });

            case 'billing-stats':
                const bills = await prisma.bill.findMany({
                    select: {
                        totalBill: true,
                        paymentStatus: true,
                    },
                });
                const totalRevenue = bills.reduce((sum, bill) => sum + bill.totalBill, 0);
                const pendingPayments = bills.filter(bill => bill.paymentStatus === 'PENDING').length;
                const failedPayments = bills.filter(bill => bill.paymentStatus === 'FAILED').length;
                return NextResponse.json({
                    totalRevenue,
                    pendingPayments,
                    failedPayments,
                }, { status: 200 });

            case 'feedback-stats':
                const feedbacks = await prisma.feedback.findMany({
                    select: {
                        replyStatus: true,
                    },
                });
                const totalFeedbacks = feedbacks.length;
                const pendingReplies = feedbacks.filter(feedback => feedback.replyStatus === 'PENDING').length;
                const resolved = feedbacks.filter(feedback => feedback.replyStatus === 'REPLIED').length;
                return NextResponse.json({
                    totalFeedbacks,
                    pendingReplies,
                    resolved,
                }, { status: 200 });

            case 'plan-stats':
                const plans = await prisma.subscriptionPlan.findMany({
                    select: {
                        id: true,
                        name: true,
                        description: true,
                        price: true,
                        gpuLimit: true,
                        storageLimit: true,
                        durationDays: true,
                        isActive: true,
                    },
                });

                const activeSubscriptions = await prisma.subscription.findMany({
                    where: { status: 'ACTIVE' },
                    select: {
                        planId: true,
                    },
                });

                const planUserCounts = await Promise.all(plans.map(async (plan) => {
                    const activeUserCount = activeSubscriptions.filter(sub => sub.planId === plan.id).length;
                    return { ...plan, activeUserCount };
                }));

                const totalPlans = plans.length;
                const bestSellingPlan = planUserCounts.reduce((max, current) =>
                    max.activeUserCount > current.activeUserCount ? max : current, { activeUserCount: 0 } as any);

                return NextResponse.json({
                    totalPlans,
                    plansWithActiveUsers: planUserCounts,
                    bestSellingPlan: {
                        name: bestSellingPlan.name,
                        activeUserCount: bestSellingPlan.activeUserCount,
                    },
                }, { status: 200 });

            default:
                return NextResponse.json({ message: 'Invalid stats type' }, { status: 400 });
        }
    } catch (error) {
        console.error(`Error fetching ${type} stats:`, error);
        return NextResponse.json({ message: 'Internal server error' }, { status: 500 });
    } finally {
        await prisma.$disconnect();
    }
}