import { Router } from "express";
import {
    startInterview,
    submitAnswer,
    finalizeInterview,
    getMyInterviews,
    getInterviewById,
} from "../controllers/interview.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/start").post(verifyJWT, startInterview);
router.route("/answer").post(verifyJWT, submitAnswer);
router.route("/finalize").post(verifyJWT, finalizeInterview);
router.route("/history").get(verifyJWT, getMyInterviews);
router.route("/:id").get(verifyJWT, getInterviewById);

export default router;