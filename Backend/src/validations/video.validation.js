import { z } from "zod";

export const videoPublishValidationSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, "Title is too short")
    .max(100, "Title is too long"),

  description: z
    .string()
    .trim()
    .min(5, "Provide a longer description")
    .max(5000, "Description is too long"),
});

export default videoPublishValidationSchema;