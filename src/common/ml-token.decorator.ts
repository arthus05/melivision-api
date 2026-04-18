import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { Request } from 'express';

/**
 * Reads the per-request ML user token set by MlTokenMiddleware.
 * Returns undefined when the caller didn't forward a user token, which
 * lets MercadolibreService fall back to the app-level token.
 */
export const MlToken = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): string | undefined => {
    const req = ctx.switchToHttp().getRequest<Request & { mlToken?: string }>();
    return req.mlToken;
  },
);
