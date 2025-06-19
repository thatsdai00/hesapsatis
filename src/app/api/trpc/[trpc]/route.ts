import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/api/root";
import { createTRPCContext } from "@/server/api/trpc";

export const GET = async (_req: Request) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    router: appRouter,
    req: _req,
    createContext: () => createTRPCContext(),
    onError: ({ error, path }) => {
      console.error(`tRPC error on ${path}:`, error);
    }
  });
};

export const POST = async (_req: Request) => {
  return fetchRequestHandler({
    endpoint: "/api/trpc",
    router: appRouter,
    req: _req,
    createContext: () => createTRPCContext(),
    onError: ({ error, path }) => {
      console.error(`tRPC error on ${path}:`, error);
    }
  });
}; 