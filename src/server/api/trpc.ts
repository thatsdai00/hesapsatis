import { initTRPC, TRPCError } from "@trpc/server";
import { ZodError } from "zod";
import { getAuthSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import superjson from "superjson";

type CreateContextOptions = {
  session: Awaited<ReturnType<typeof getAuthSession>>;
};

export const createInnerTRPCContext = (opts: CreateContextOptions) => {
  return {
    session: opts.session,
    prisma,
  };
};

export const createTRPCContext = async () => {
  const session = await getAuthSession();
  
  // Log session info for debugging
  console.log("TRPC Context Session:", JSON.stringify({
    exists: !!session,
    user: session?.user ? {
      id: session.user.id,
      role: session.user.role
    } : null
  }));
  
  return createInnerTRPCContext({
    session,
  });
};

const t = initTRPC.context<typeof createTRPCContext>().create({
  transformer: superjson,
  errorFormatter({ shape, error }) {
    return {
      ...shape,
      data: {
        ...shape.data,
        zodError:
          error.cause instanceof ZodError ? error.cause.flatten() : null,
      },
    };
  },
});

export const createTRPCRouter = t.router;
export const publicProcedure = t.procedure;

// Reusable middleware to ensure users are authenticated
const enforceUserIsAuthed = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    console.error("Authentication middleware failed: No user session");
    throw new TRPCError({ 
      code: "UNAUTHORIZED",
      message: "You must be logged in" 
    });
  }
  
  // Check if user is banned
  if (ctx.session.user.role === "BANNED") {
    console.error(`Auth middleware failed: User ${ctx.session.user.id} is banned`);
    throw new TRPCError({ 
      code: "FORBIDDEN", 
      message: "Your account has been banned" 
    });
  }
  
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const protectedProcedure = t.procedure.use(enforceUserIsAuthed);

// Reusable middleware to ensure users have admin role
const enforceUserIsAdmin = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    console.error("Admin middleware failed: No user session");
    throw new TRPCError({ 
      code: "UNAUTHORIZED",
      message: "You must be logged in to access admin resources" 
    });
  }
  
  if (ctx.session.user.role !== "ADMIN" && ctx.session.user.role !== "MANAGER") {
    console.error(`Admin middleware failed: User role ${ctx.session.user.role} is not ADMIN or MANAGER`);
    throw new TRPCError({ 
      code: "FORBIDDEN", 
      message: "You do not have permission to access admin resources" 
    });
  }
  
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

// Reusable middleware to ensure users have supporter role (or higher)
const enforceUserIsSupporter = t.middleware(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    console.error("Supporter middleware failed: No user session");
    throw new TRPCError({ 
      code: "UNAUTHORIZED",
      message: "You must be logged in to access support resources" 
    });
  }
  
  const allowedRoles = ["ADMIN", "MANAGER", "SUPPORTER"];
  if (!allowedRoles.includes(ctx.session.user.role)) {
    console.error(`Supporter middleware failed: User role ${ctx.session.user.role} is not allowed`);
    throw new TRPCError({ 
      code: "FORBIDDEN", 
      message: "You do not have permission to access support resources" 
    });
  }
  
  return next({
    ctx: {
      session: { ...ctx.session, user: ctx.session.user },
    },
  });
});

export const adminProcedure = t.procedure.use(enforceUserIsAdmin);
export const supporterProcedure = t.procedure.use(enforceUserIsSupporter); 