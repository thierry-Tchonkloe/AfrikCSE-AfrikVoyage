import { RequestHandler } from "express";
import { z, ZodSchema } from "zod";

/**
 * Valide req.params avec le schéma Zod fourni et retype la requête en conséquence,
 * pour toute la chaîne middleware -> contrôleur (ex: `Request<IdParamInt>`).
 * Aucun cast n'est nécessaire côté contrôleur : le seul `as any` du projet reste ici,
 * borné à la conversion validée (ex: string -> number pour ContactRequest.id).
 */
export function validateParams<T extends ZodSchema>(schema: T): RequestHandler<z.infer<T>> {
  return (req, res, next) => {
    const parsed = schema.safeParse(req.params);
    if (!parsed.success) {
      res.status(400).json({ success: false, errors: parsed.error.flatten().fieldErrors });
      return;
    }

    req.params = parsed.data as any;
    next();
  };
}
