import { z } from "zod";

const registerValidationSchema = z.object({
  username: z.string().trim().min(3, "Username must be more than 3 characters"),
  email: z.string().trim().email("Invalid email address!"),
  fullname: z.string().trim().min(3,"Fullname required!"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  avatar: z.string(),
  coverImage: z.string()
});


export default registerValidationSchema;