import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";

const startOfToday = () => {
    const date = new Date();
    date.setHours(0, 0, 0, 0);
    return date;
};

const last7Days = () => {
    const date = new Date();
    date.setDate(date.getDate() - 6);
    date.setHours(0, 0, 0, 0);
    return date;
};

export const getDashboard = async (_req: Request, res: Response) => {
    try {
        const today = startOfToday();
        const sevenDaysAgo = last7Days();

        const [
            totalBookings,
            todayBookings,
            completedBookings,
            pendingBookings,
            cancelledBookings,
            totalRevenue,
            activeMechanics,
            newCustomers,
            recentBookings,
            mechanics,
            chartBookings,
        ] = await Promise.all([
            prisma.booking.count(),

            prisma.booking.count({
                where: {
                    createdAt: {
                        gte: today,
                    },
                },
            }),

            prisma.booking.count({
                where: {
                    status: "COMPLETED",
                },
            }),

            prisma.booking.count({
                where: {
                    status: "PENDING",
                },
            }),

            prisma.booking.count({
                where: {
                    status: "CANCELLED",
                },
            }),

            prisma.booking.aggregate({
                where: {
                    status: "COMPLETED",
                },
                _sum: {
                    amount: true,
                },
            }),

            prisma.mechanic.count({
                where: {
                    status: {
                        not: "OFFLINE",
                    },
                },
            }),

            prisma.customer.count({
                where: {
                    createdAt: {
                        gte: today,
                    },
                },
            }),

            prisma.booking.findMany({
                take: 10,
                orderBy: {
                    createdAt: "desc",
                },
                include: {
                    customer: true,
                    vehicle: true,
                    service: {
                        include: {
                            category: true,
                        },
                    },
                    mechanic: true,
                },
            }),

            prisma.mechanic.findMany({
                take: 10,
                orderBy: {
                    jobsCompleted: "desc",
                },
            }),

            prisma.booking.findMany({
                where: {
                    createdAt: {
                        gte: sevenDaysAgo,
                    },
                },
                include: {
                    service: {
                        include: {
                            category: true,
                        },
                    },
                },
            }),
        ]);

        const bookingStatus = await prisma.booking.groupBy({
            by: ["status"],
            _count: {
                status: true,
            },
        });

        const bookingsOverTime = chartBookings.reduce<Record<string, number>>(
            (acc, booking) => {
                const date = booking.createdAt.toISOString().split("T")[0];
                acc[date] = (acc[date] || 0) + 1;
                return acc;
            },
            {}
        );

        const revenueOverTime = chartBookings.reduce<Record<string, number>>(
            (acc, booking) => {
                const date = booking.createdAt.toISOString().split("T")[0];
                acc[date] = (acc[date] || 0) + Number(booking.amount);
                return acc;
            },
            {}
        );

        const serviceBreakdown = chartBookings.reduce<Record<string, number>>(
            (acc, booking) => {
                const category = booking.service.category.name;
                acc[category] = (acc[category] || 0) + 1;
                return acc;
            },
            {}
        );

        return res.status(200).json({
            overview: {
                totalBookings,
                todayBookings,
                completedBookings,
                pendingBookings,
                cancelledBookings,
                totalRevenue: Number(totalRevenue._sum.amount || 0),
                activeMechanics,
                newCustomers,
            },
            analytics: {
                bookingsOverTime,
                revenueOverTime,
                bookingStatus,
                serviceBreakdown,
            },
            recentBookings,
            mechanics,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch dashboard data",
        });
    }
};