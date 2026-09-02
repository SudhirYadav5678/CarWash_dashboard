import type { Request, Response } from "express";
import { prisma } from "../db/prisma";

export const createMechanic = async (req: Request, res: Response) => {
    try {
        const {
            name,
            phone,
            email,
            status,
            specialization,
            rating,
            jobsCompleted,
            currentLat,
            currentLng,
        } = req.body;

        if (!name || !phone) {
            return res.status(400).json({
                message: "Name and phone are required",
            });
        }

        const existingMechanic = await prisma.mechanic.findFirst({
            where: {
                OR: [{ phone }, ...(email ? [{ email }] : [])],
            },
        });

        if (existingMechanic) {
            return res.status(409).json({
                message: "Mechanic already exists",
            });
        }

        const mechanic = await prisma.mechanic.create({
            data: {
                name,
                phone,
                email,
                status: status ?? "AVAILABLE",
                specialization,
                rating: rating ? Number(rating) : 0,
                jobsCompleted: jobsCompleted ? Number(jobsCompleted) : 0,
                currentLat: currentLat ? Number(currentLat) : undefined,
                currentLng: currentLng ? Number(currentLng) : undefined,
                lastActiveAt: new Date(),
            },
        });

        return res.status(201).json({
            message: "Mechanic created successfully",
            mechanic,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to create mechanic",
        });
    }
};

export const getMechanics = async (req: Request, res: Response) => {
    try {
        const {
            search,
            status,
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
            ...(search
                ? {
                    OR: [
                        {
                            name: {
                                contains: String(search),
                                mode: "insensitive",
                            },
                        },
                        {
                            phone: {
                                contains: String(search),
                                mode: "insensitive",
                            },
                        },
                        {
                            email: {
                                contains: String(search),
                                mode: "insensitive",
                            },
                        },
                        {
                            specialization: {
                                contains: String(search),
                                mode: "insensitive",
                            },
                        },
                    ],
                }
                : {}),
        };

        const [mechanics, total] = await Promise.all([
            prisma.mechanic.findMany({
                where,
                skip,
                take: pageSize,
                orderBy: {
                    [String(sortBy)]: sortOrder === "asc" ? "asc" : "desc",
                },
                include: {
                    bookings: {
                        take: 1,
                        orderBy: {
                            createdAt: "desc",
                        },
                        include: {
                            customer: true,
                            vehicle: true,
                            service: true,
                        },
                    },
                },
            }),

            prisma.mechanic.count({ where }),
        ]);

        return res.status(200).json({
            data: mechanics,
            pagination: {
                total,
                page: pageNumber,
                limit: pageSize,
                totalPages: Math.ceil(total / pageSize),
            },
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch mechanics",
        });
    }
};

export const getMechanicById = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);

        const mechanic = await prisma.mechanic.findUnique({
            where: { id },
            include: {
                bookings: {
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
                    },
                },
            },
        });

        if (!mechanic) {
            return res.status(404).json({
                message: "Mechanic not found",
            });
        }

        return res.status(200).json({
            mechanic,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to fetch mechanic",
        });
    }
};

export const updateMechanic = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);

        const {
            name,
            phone,
            email,
            status,
            specialization,
            rating,
            jobsCompleted,
            currentLat,
            currentLng,
        } = req.body;

        const existingMechanic = await prisma.mechanic.findUnique({
            where: { id },
        });

        if (!existingMechanic) {
            return res.status(404).json({
                message: "Mechanic not found",
            });
        }

        const mechanic = await prisma.mechanic.update({
            where: { id },
            data: {
                name,
                phone,
                email,
                status,
                specialization,
                rating: rating !== undefined ? Number(rating) : undefined,
                jobsCompleted:
                    jobsCompleted !== undefined ? Number(jobsCompleted) : undefined,
                currentLat: currentLat !== undefined ? Number(currentLat) : undefined,
                currentLng: currentLng !== undefined ? Number(currentLng) : undefined,
                lastActiveAt: new Date(),
            },
        });

        return res.status(200).json({
            message: "Mechanic updated successfully",
            mechanic,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to update mechanic",
        });
    }
};

export const updateMechanicStatus = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);
        const { status } = req.body;

        if (!status) {
            return res.status(400).json({
                message: "Status is required",
            });
        }

        const mechanic = await prisma.mechanic.update({
            where: { id },
            data: {
                status,
                lastActiveAt: new Date(),
            },
        });

        return res.status(200).json({
            message: "Mechanic status updated successfully",
            mechanic,
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to update mechanic status",
        });
    }
};

export const deleteMechanic = async (req: Request, res: Response) => {
    try {
        const id = String(req.params.id);

        await prisma.mechanic.delete({
            where: { id },
        });

        return res.status(200).json({
            message: "Mechanic deleted successfully",
        });
    } catch (error) {
        return res.status(500).json({
            message: "Failed to delete mechanic",
        });
    }
};