import type { Request, Response } from "express";
import { prisma } from "../db/prisma";

export const createBooking = async (req: Request, res: Response) => {
    try {
        const {
            customerId,
            vehicleId,
            serviceId,
            mechanicId,
            scheduledAt,
            amount,
            pickupAddress,
            latitude,
            longitude,
        } = req.body;

        if (!customerId || !vehicleId || !serviceId || !scheduledAt || !amount) {
            return res.status(400).json({
                message:
                    "customerId, vehicleId, serviceId, scheduledAt, and amount are required",
            });
        }

        const booking = await prisma.booking.create({
            data: {
                bookingCode: `BK-${Date.now()}`,
                customerId,
                vehicleId,
                serviceId,
                mechanicId,
                scheduledAt: new Date(scheduledAt),
                amount,
                pickupAddress,
                latitude,
                longitude,
                status: mechanicId ? "ASSIGNED" : "PENDING",
                paymentStatus: "PENDING",
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
        });

        return res.status(201).json({
            message: "Booking created successfully",
            booking,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to create booking",
        });
    }
};

export const getBookings = async (req: Request, res: Response) => {
    try {
        const {
            search,
            status,
            mechanicId,
            customerId,
            page = "1",
            limit = "10",
            sortBy = "createdAt",
            sortOrder = "desc",
        } = req.query;

        const pageNumber = Number(page);
        const pageSize = Number(limit);
        const skip = (pageNumber - 1) * pageSize;

        const where: any = {
            ...(status ? { status } : {}),
            ...(mechanicId ? { mechanicId } : {}),
            ...(customerId ? { customerId } : {}),
            ...(search
                ? {
                    OR: [
                        { bookingCode: { contains: String(search), mode: "insensitive" } },
                        { customer: { name: { contains: String(search), mode: "insensitive" } } },
                        { customer: { phone: { contains: String(search), mode: "insensitive" } } },
                        { vehicle: { make: { contains: String(search), mode: "insensitive" } } },
                        { vehicle: { model: { contains: String(search), mode: "insensitive" } } },
                        { service: { name: { contains: String(search), mode: "insensitive" } } },
                    ],
                }
                : {}),
        };

        const [bookings, total] = await Promise.all([
            prisma.booking.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: {
                    [String(sortBy)]: sortOrder === "asc" ? "asc" : "desc",
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
            prisma.booking.count({ where }),
        ]);

        return res.status(200).json({
            data: bookings,
            pagination: {
                total,
                page: pageNumber,
                limit: pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch bookings",
        });
    }
};

export const getBookingById = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);

        const booking = await prisma.booking.findUnique({
            where: { id },
            include: {
                customer: true,
                vehicle: true,
                service: {
                    include: {
                        category: true,
                    },
                },
                mechanic: true,
                statusHistory: true,
            },
        });

        if (!booking) {
            return res.status(404).json({
                message: "Booking not found",
            });
        }

        return res.status(200).json({
            booking,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch booking",
        });
    }
};

export const updateBookingStatus = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const { status, note } = req.body;

        if (!status) {
            return res.status(400).json({
                message: "Status is required",
            });
        }

        const existingBooking = await prisma.booking.findUnique({
            where: { id },
        });

        if (!existingBooking) {
            return res.status(404).json({
                message: "Booking not found",
            });
        }

        const booking = await prisma.booking.update({
            where: { id },
            data: {
                status,
                completedAt: status === "COMPLETED" ? new Date() : undefined,
                cancelledAt: status === "CANCELLED" ? new Date() : undefined,
                statusHistory: {
                    create: {
                        fromStatus: existingBooking.status,
                        toStatus: status,
                        note,
                    },
                },
            },
            include: {
                customer: true,
                vehicle: true,
                service: true,
                mechanic: true,
                statusHistory: true,
            },
        });

        return res.status(200).json({
            message: "Booking status updated successfully",
            booking,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to update booking status",
        });
    }
};

export const cancelBooking = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const { cancelReason } = req.body;

        const existingBooking = await prisma.booking.findUnique({
            where: { id },
        });

        if (!existingBooking) {
            return res.status(404).json({
                message: "Booking not found",
            });
        }

        const booking = await prisma.booking.update({
            where: { id },
            data: {
                status: "CANCELLED",
                cancelledAt: new Date(),
                cancelReason,
                statusHistory: {
                    create: {
                        fromStatus: existingBooking.status,
                        toStatus: "CANCELLED",
                        note: cancelReason,
                    },
                },
            },
        });

        return res.status(200).json({
            message: "Booking cancelled successfully",
            booking,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to cancel booking",
        });
    }
};