import { z } from "zod";

export const idParamCuid = z.object({ id: z.string().cuid() });
export const idParamUuid = z.object({ id: z.string().uuid() });
export const idParamString = z.object({ id: z.string().min(1) });

// Integer id (e.g. ContactRequest) : parse string -> number then validate
export const idParamInt = z.object({
  id: z.preprocess((val) => {
    if (typeof val === "string" || typeof val === "number") return Number(val);
    return val;
  }, z.number().int().nonnegative()),
});

export type IdParamCuid = z.infer<typeof idParamCuid>;
export type IdParamUuid = z.infer<typeof idParamUuid>;
export type IdParamString = z.infer<typeof idParamString>;
export type IdParamInt = z.infer<typeof idParamInt>;
