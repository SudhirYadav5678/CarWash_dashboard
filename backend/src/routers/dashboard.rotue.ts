import { Router } from "express";
import { getDashboard } from "../controller/dashboard.controllers";

const router = Router();

router.get("/", getDashboard);

export default router;