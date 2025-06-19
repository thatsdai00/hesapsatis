import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "../trpc";

export const exampleRouter = createTRPCRouter({
  hello: publicProcedure
    .input(
      z.object({
        text: z.string(),
      })
    )
    .query(({ input }) => {
      return {
        greeting: `Hello ${input.text || "world"}`,
        time: new Date(),
      };
    }),

  add: publicProcedure
    .input(
      z.object({
        num1: z.number(),
        num2: z.number(),
      })
    )
    .mutation(({ input }) => {
      return {
        sum: input.num1 + input.num2,
      };
    }),
}); 