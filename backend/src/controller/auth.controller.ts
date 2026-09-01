import type { Request, Response } from "express";
import { comparePassword, hashPassword } from "../middleware/passwordBcrypt.js";
import { prisma } from "../db/prisma.js";
import type { User, UserRole } from "../generated/prisma/client.js";
import { generateToken } from "../middleware/token.js";

// user register
export const registerUser = async (req: Request, res: Response) => {
    // user input validation
    const { username, email, password, role }: { username: string; email: string; password: string; role: UserRole } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({
            message: "Username, email, and password are required",
        });
    }

    // Hash the password
    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
        data: {
            name: username,
            email,
            password: hashedPassword,
            role
        }
    });

    return res.status(201).json({
        message: "User registered successfully",
        user
    });
};

// user login
export const loginUser = async (req: Request, res: Response) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            message: "Email and password are required",
        });
    }

    const user = await prisma.user.findUnique({
        where: {
            email,
        },
    });

    const isPasswordValid = user
        ? await comparePassword(password, user.password)
        : false;

    if (!user || !isPasswordValid) {
        return res.status(401).json({
            message: "Invalid email or password",
        });
    }

    const token = generateToken(user.id, user.role);

    res.cookie("token", token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    return res.status(200).json({
        message: "User logged in successfully",
        user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    });
};

// user logout
export const logoutUser = async (req: Request, res: Response) => {
    // Clear the user session 
    res.clearCookie("token", {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
    });
    res.status(200).json({
        message: "User logged out successfully"
    });
}

// user update and delete and add after.

