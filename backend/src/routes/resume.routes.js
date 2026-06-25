import { Router } from "express";
import { uploadResume, getMyResume } from "../controllers/resume.controller.js";
import { upload } from "../middlewares/multer.middleware.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/upload").post(verifyJWT, upload.single("resume"), uploadResume);
router.route("/me").get(verifyJWT, getMyResume);

export default router;