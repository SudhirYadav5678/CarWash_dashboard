import express from "express";
import { json } from "body-parser";
import { prisma } from "./db/prisma.js";

//routes import
import userAuthRoutes from "./routers/userAuth.route";
import customerAuthRoutes from "./routers/customer.route";
import dashboardRoutes from "./routers/dashboard.rotue";

const app = express();

app.use(json());

app.get("/", (_req, res) => {
    res.json({
        message: "Instant Mechanic API is running",
    });
});

app.get("/api/health", async (_req, res) => {
    try {
        await prisma.$queryRaw`SELECT 1`;

        res.json({
            status: "ok",
            database: "connected",
        });
    } catch (error) {
        res.status(500).json({
            status: "error",
            database: "disconnected",
        });
    }
});
app.use("/api/auth", userAuthRoutes);
app.use("/api/customer", customerAuthRoutes);
app.use("/api/dashboard", dashboardRoutes);

app.listen(3000, () => {
    console.log("Server is running on port 3000");
});