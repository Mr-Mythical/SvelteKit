import { z } from "zod";
 
export const formSchema = z.object({
  email: z
    .string({ required_error: "Please select an email to display" })
    .email()
});
 
export type FormSchema = typeof formSchema;