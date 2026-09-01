import { Router } from "express";
import {
    registerCustomer,
    loginCustomer,
    logoutCustomer,
} from "../controllers/customerAuth.controllers.ts";

const router = Router();

router.post("/register", registerCustomer);
router.post("/login", loginCustomer);
router.post("/logout", logoutCustomer);

export default router;