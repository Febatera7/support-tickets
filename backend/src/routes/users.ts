import { Router } from "express";

import * as UserController from "#src/controllers/UserController";
import { authenticate, requireRole } from "#src/middlewares/auth";
import { UserRole } from "#src/types";

const router = Router();

router.post("/", UserController.createUser);
router.get("/operators", authenticate, requireRole(UserRole.ADMIN), UserController.listOperators);
router.get("/me", authenticate, UserController.getMe);
router.patch("/me", authenticate, UserController.updateMe);

export { router as userRouter };