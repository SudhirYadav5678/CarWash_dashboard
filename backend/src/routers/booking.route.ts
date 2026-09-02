import { Router } from "express";
import {
    cancelBooking,
    createBooking,
    getBookingById,
    getBookings,
    updateBookingStatus,
} from "../controller/booking.controllers";

const router = Router();

router.post("/", createBooking);
router.get("/", getBookings);
router.get("/:id", getBookingById);
router.patch("/:id/status", updateBookingStatus);
router.patch("/:id/cancel", cancelBooking);

export default router;