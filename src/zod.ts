import { z } from "zod";

const validateUser = z.object({
    email : z.string().email(),
    name: z.string(),
    password: z.string().min(8)
})

const validateEmail = z.string().email()

export default {validateUser,validateEmail}