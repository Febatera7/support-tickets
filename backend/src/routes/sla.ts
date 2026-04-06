import { Router } from "express";

import * as SLAController from "#src/controllers/SLAController";
import { authenticate, requireRole } from "#src/middlewares/auth";
import { UserRole } from "#src/types";

const router = Router();

router.use(authenticate, requireRole(UserRole.ADMIN));

router.get("/", SLAController.listSLAConfigs);
router.put("/:priority", SLAController.updateSLAConfig);

export { router as slaRouter };