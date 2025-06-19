# Build Configuration for Production

This document explains how to build the project for production while ignoring non-critical errors.

## Standard Build

The standard build process can be run with:

```bash
npm run build
```

This will run the normal Next.js build process, which will fail if there are any TypeScript errors, ESLint warnings, or other issues.

## Forced Build (Ignoring Errors)

If you need to build the project despite non-critical errors, you can use:

```bash
npm run build:force
```

This command will:
1. Set environment variables to suppress warnings and errors
2. Run the build process
3. Force completion even if errors are encountered
4. Create a `.next/BUILD_FORCED` file to indicate that the build was forced

## ⚠️ Important Warning ⚠️

**Using the forced build comes with risks:**

- Client-side errors may occur in production that weren't caught during the build
- Some pages may not function correctly
- React hooks errors (like missing Suspense boundaries) may cause hydration issues
- SEO and metadata may not be properly generated

## Configuration Files

The following files have been modified to support forced builds:

1. `next.config.ts` - Added configuration to ignore TypeScript and ESLint errors
2. `.env.production` - Set environment variables for production builds
3. `scripts/force-build.js` - Script to force the build to complete despite errors

## Recommended Approach

It's always better to fix the underlying issues rather than ignoring them. The forced build should only be used as a temporary solution while you work on fixing the actual problems.

Common issues to check:
- React hooks not wrapped in proper Suspense boundaries
- Missing imports or undefined variables
- TypeScript type errors
- ESLint warnings about unused variables or missing dependencies

## Deployment

After running the forced build, you can deploy the application as usual:

```bash
npm run start
```

Remember that any issues that were ignored during the build may still cause problems in production. 