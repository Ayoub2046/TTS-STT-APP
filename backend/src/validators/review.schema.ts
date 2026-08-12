import { z } from "zod";

export const qualityScoreSchema = z.object({
  qualityScore: z.number().int().min(1).max(5),
});

export const reviewCreateSchema = z
  .object({
    decision: z.enum(["approve", "reject", "request_correction"]),
    comment: z.string().max(2000).optional(),
    correctedSource: z.string().max(2000).optional(),
    correctedTarget: z.string().max(2000).optional(),
    qualityScore: z.number().int().min(1).max(5).optional(),
  })
  .superRefine((data, ctx) => {
    if (data.decision === "request_correction" && !data.correctedSource && !data.correctedTarget && !data.comment) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "A correction must include corrected text or a comment.",
        path: ["correctedSource"],
      });
    }
    if (data.decision === "approve" && !data.qualityScore) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Quality score is required when approving.",
        path: ["qualityScore"],
      });
    }
  });