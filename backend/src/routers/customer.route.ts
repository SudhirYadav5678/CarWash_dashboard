import { Router } from "express";
import {
    registerCustomer,
    loginCustomer,
    logoutCustomer,
} from "../controller/customerAuth.controller";

const router = Router();

router.post("/register", registerCustomer);
router.post("/login", loginCustomer);
router.post("/logout", logoutCustomer);

export default router;