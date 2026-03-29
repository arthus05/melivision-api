import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { AuthService } from '../modules/auth/auth.service';

/**
 * Injects X-ML-Token header into AuthService so MercadolibreService
 * can use a per-request token forwarded from meli-agent-api.
 * Falls back to the in-memory token if header is absent.
 */
@Injectable()
export class MlTokenMiddleware implements NestMiddleware {
  constructor(private readonly authService: AuthService) {}

  use(req: Request, _res: Response, next: NextFunction) {
    const token = req.headers['x-ml-token'] as string | undefined;
    if (token) {
      // 6 hours in seconds — standard ML token lifetime
      this.authService.setAccessToken(token, 21600);
    }
    next();
  }
}
