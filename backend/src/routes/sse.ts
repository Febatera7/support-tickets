import { Router } from "express";

import * as SSEController from "#src/controllers/SSEController";
import { authenticateSSE } from "#src/middlewares/auth";

const router = Router();

router.get("/", authenticateSSE, SSEController.connectSSE);

export { router as sseRouter };