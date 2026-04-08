import { Request, Response, NextFunction } from "express";

import { UserRole } from "#src/entities/User";
import { authenticate } from "#src/middlewares/auth";
import { UserService } from "#src/services/UserService";
import { AuthenticatedRequest } from "#src/types";
import {
  CreateUserSchema,
  CreateOperatorSchema,
  UpdateMeSchema
} from "#src/validators/schemas";

const service = new UserService();

export async function createUser(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { role, ...body } = req.body as { role?: string } & Record<
      string,
      unknown
    >;

    const isPrivilegedRole =
      role && role !== UserRole.USER;

    if (isPrivilegedRole) {
      await new Promise<void>((resolve, reject) => {
        authenticate(req, res, (err) => (err ? reject(err) : resolve()));
      });

      const actor = (req as AuthenticatedRequest).user;
      if (actor.role !== UserRole.ADMIN) {
        res.status(403).json({ status: "error", message: "Forbidden" });
        return;
      }

      const dto = CreateOperatorSchema.parse(body);
      const targetRole =
        role === UserRole.ADMIN ? UserRole.ADMIN : UserRole.OPERATOR;
      const created = await service.registerWithRole(
        dto,
        actor.dbUserId,
        targetRole
      );
      res.status(201).json({
        status: "success",
        data: {
          id: created.id,
          name: created.name,
          email: created.email,
          role: created.role,
          createdAt: created.createdAt
        }
      });
      return;
    }

    const dto = CreateUserSchema.parse(req.body);
    const user = await service.registerUser(dto);
    res.status(201).json({
      status: "success",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function listOperators(
  _req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const ops = await service.findAllOperators();
    res.json({
      status: "success",
      data: ops.map((o) => ({
        id: o.id,
        name: o.name,
        email: o.email,
        createdAt: o.createdAt
      }))
    });
  } catch (err) {
    next(err);
  }
}

export async function getMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const actor = (req as AuthenticatedRequest).user;
    const user = await service.findById(actor.dbUserId);
    res.json({
      status: "success",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        cpf: user.cpf ? `***.***.***-${user.cpf.slice(-2)}` : null,
        phone: user.phone,
        cep: user.cep,
        street: user.street,
        neighborhood: user.neighborhood,
        city: user.city,
        state: user.state,
        country: user.country,
        number: user.number,
        complement: user.complement,
        emailValidated: user.emailValidated,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
}

export async function updateMe(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const actor = (req as AuthenticatedRequest).user;
    const dto = UpdateMeSchema.parse(req.body);
    const user = await service.updateMe(actor.dbUserId, dto);
    res.json({
      status: "success",
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        cpf: user.cpf ? `***.***.***-${user.cpf.slice(-2)}` : null,
        phone: user.phone,
        cep: user.cep,
        street: user.street,
        neighborhood: user.neighborhood,
        city: user.city,
        state: user.state,
        country: user.country,
        number: user.number,
        complement: user.complement,
        emailValidated: user.emailValidated,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    next(err);
  }
}