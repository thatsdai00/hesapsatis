import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

export const GET = async (req: Request) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createTRPCContext(),
    onError: ({ error, path }) => {
      console.error(`tRPC error on ${path}:`, error);
    },
  });
};

export const POST = async (req: Request) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: () => createTRPCContext(),
    onError: ({ error, path }) => {
      console.error(`tRPC error on ${path}:`, error);
    },
  });
}; 