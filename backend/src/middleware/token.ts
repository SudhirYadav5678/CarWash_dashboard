import jwt from "jsonwebtoken";
import { Request, Response, NextFunction } from "express";
import dotenv from "dotenv";

dotenv.config();

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
        return res.status(401).json({
            message: "Access denied. No token provided."
        });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
        (req as any).user = decoded;
        next();
    } catch (error) {
        return res.status(400).json({
            message: "Invalid token."
        });
    }
};


export const generateToken = (userId: string, role: string) => {
    const payload = {
        userId,
        role
    };
    return jwt.sign(payload, process.env.JWT_SECRET as string, { expiresIn: "1h" });
};