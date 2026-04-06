import { Router } from "express";

import * as SSEController from "#src/controllers/SSEController";
import { authenticate } from "#src/middlewares/auth";

const router = Router();

router.get("/", authenticate, SSEController.connectSSE);

export { router as sseRouter };