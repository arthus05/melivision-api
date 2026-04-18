import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Attaches the forwarded X-ML-Token header to the request object so downstream
 * handlers can read it via the @MlToken() param decorator. No shared state.
 */
@Injectable()
export class MlTokenMiddleware implements NestMiddleware {
  use(req: Request & { mlToken?: string }, _res: Response, next: NextFunction) {
    const token = req.headers['x-ml-token'];
    if (typeof token === 'string' && token.length > 0) {
      req.mlToken = token;
    }
    next();
  }
}
