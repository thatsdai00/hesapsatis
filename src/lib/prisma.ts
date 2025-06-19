import { PrismaClient } from '@prisma/client'

// Use a single instance of Prisma Client in development
const prismaClientSingleton = () => {
  // Check if we're in a browser environment
  if (typeof window !== 'undefined' || !global?.process?.versions?.node) {
    console.warn('PrismaClient is being initialized in a browser environment. Creating a mock client.');
    return {} as PrismaClient;
  }

  try {
    const client = new PrismaClient({
      log: ['query', 'error', 'warn'],
    });
    
    // Add middleware for error logging without TypeScript errors
    client.$use(async (params, next) => {
      try {
        return await next(params);
      } catch (error) {
        console.error(`Prisma Error in ${params.model}.${params.action}:`, error);
        throw error;
      }
    });
    
    console.log('Prisma Client initialized successfully');
    return client;
  } catch (error) {
    console.error('Failed to initialize Prisma Client:', error);
    throw error;
  }
}

declare global {
  var prisma: undefined | ReturnType<typeof prismaClientSingleton>
}

let prisma: ReturnType<typeof prismaClientSingleton>;

try {
  prisma = global.prisma ?? prismaClientSingleton();
  
  if (process.env.NODE_ENV !== 'production') {
    global.prisma = prisma;
  }
} catch (error) {
  console.error('Error initializing Prisma client:', error);
  throw error;
}

export default prisma 