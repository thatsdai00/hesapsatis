import { PrismaClient } from '@prisma/client'

// Use a single global instance of Prisma Client
let prisma: PrismaClient;

try {
  prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
  });
  
  // Add middleware for error logging
  // In production we need to use any here because of conflicts between
  // the global Prisma types and the project-specific generated types
  // @ts-expect-error - Type conflicts between global Prisma types and project-specific generated types
  prisma.$use(async (params, next) => {
    try {
      return await next(params);
    } catch (error) {
      console.error(`Prisma Error in ${params.model}.${params.action}:`, error);
      throw error;
    }
  });
  
  console.log('DB Client initialized successfully');
} catch (error) {
  console.error('Failed to initialize DB Client:', error);
  throw error;
}

export default prisma 