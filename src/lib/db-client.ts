import { PrismaClient } from '../generated/prisma'

// Use a single global instance of Prisma Client
let prisma: PrismaClient;

try {
  prisma = new PrismaClient({
    log: ['query', 'error', 'warn'],
  });
  
  // Add middleware for error logging
  // @ts-ignore - Prisma middleware types can be complex
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