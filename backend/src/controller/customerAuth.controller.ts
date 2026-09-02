import type { Request, Response } from "express";
import { prisma } from "../db/prisma.js";
import { generateToken } from "../middleware/token.js";
import {
    comparePassword,
    hashPassword,
} from "../middleware/passwordBcrypt.js";

type RegisterCustomerBody = {
    name: string;
    email?: string;
    phone: string;
    password: string;
    address?: string;
    city?: string;
};

type LoginCustomerBody = {
    email?: string;
    phone?: string;
    password: string;
};

export const registerCustomer = async (req: Request, res: Response) => {
    const {
        name,
        email,
        phone,
        password,
        address,
        city,
    } = req.body as RegisterCustomerBody;

    if (!name || !phone || !password) {
        return res.status(400).json({
            message: "Name, phone, and password are required",
        });
    }

    const existingCustomer = await prisma.customer.findFirst({
        where: {
            OR: [{ phone }, ...(email ? [{ email }] : [])],
        },
    });

    if (existingCustomer) {
        return res.status(409).json({
            message: "Customer already exists",
        });
    }

    const hashedPassword = await hashPassword(password);

    const customer = await prisma.customer.create({
        data: {
            name,
            email,
            phone,
            password: hashedPassword,
            address,
            city,
        },
        select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            createdAt: true,
        },
    });

    return res.status(201).json({
        message: "Customer registered successfully",
        customer,
    });
};

export const loginCustomer = async (req: Request, res: Response) => {
    const { email, phone, password } = req.body as LoginCustomerBody;

    if ((!email && !phone) || !password) {
        return res.status(400).json({
            message: "Email or phone and password are required",
        });
    }

    const customer = await prisma.customer.findFirst({
        where: {
            OR: [
                ...(email ? [{ email }] : []),
                ...(phone ? [{ phone }] : []),
            ],
        },
    });

    const isPasswordValid = customer
        ? await comparePassword(password, customer.password)
        : false;

    if (!customer || !isPasswordValid) {
        return res.status(401).json({
            message: "Invalid credentials",
        });
    }

    const token = generateToken(customer.id, "CUSTOMER");

    res.cookie("customerToken", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    return res.status(200).json({
        message: "Customer logged in successfully",
        customer: {
            id: customer.id,
            name: customer.name,
            email: customer.email,
            phone: customer.phone,
        },
    });
};

export const logoutCustomer = async (_req: Request, res: Response) => {
    res.clearCookie("customerToken", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });

    return res.status(200).json({
        message: "Customer logged out successfully",
    });
};


