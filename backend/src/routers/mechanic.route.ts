import { Router } from "express";
import {
    createMechanic,
    deleteMechanic,
    getMechanicById,
    getMechanics,
    updateMechanic,
    updateMechanicStatus,
} from "../controller/mechanic.controllers";

const router = Router();

router.post("/", createMechanic);
router.get("/", getMechanics);
router.get("/:id", getMechanicById);
router.patch("/:id", updateMechanic);
router.patch("/:id/status", updateMechanicStatus);
router.delete("/:id", deleteMechanic);

export default router;