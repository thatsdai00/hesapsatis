import { exampleRouter } from "./routers/example";
import { adminRouter } from "./routers/admin";
import { publicRouter } from "./routers/public";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  example: exampleRouter,
  admin: adminRouter,
  public: publicRouter,
});

export type AppRouter = typeof appRouter; 