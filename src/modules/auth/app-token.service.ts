import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';

/**
 * Caches a client_credentials grant token shared across the whole app.
 * This token is NOT user-scoped, so singleton state here is safe.
 * ML tokens are valid for ~6h; refresh a minute early to avoid races.
 */
@Injectable()
export class AppTokenService {
  private readonly logger = new Logger(AppTokenService.name);
  private token: string | null = null;
  private expiry: Date | null = null;
  private inflight: Promise<string> | null = null;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  async getToken(): Promise<string> {
    if (
      this.token &&
      this.expiry &&
      new Date() < new Date(this.expiry.getTime() - 60_000)
    ) {
      return this.token;
    }
    if (this.inflight) return this.inflight;

    this.inflight = (async () => {
      const tokenUrl = this.configService.get<string>('mercadolibre.tokenUrl');
      const clientId = this.configService.get<string>('mercadolibre.clientId');
      const clientSecret = this.configService.get<string>('mercadolibre.clientSecret');

      if (!clientId || !clientSecret) {
        throw new UnauthorizedException(
          'ML_CLIENT_ID / ML_CLIENT_SECRET not configured — cannot fetch app token',
        );
      }

      const params = new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: clientId,
        client_secret: clientSecret,
      });

      try {
        const response = await firstValueFrom(
          this.httpService.post(tokenUrl, params.toString(), {
            headers: {
              'Content-Type': 'application/x-www-form-urlencoded',
              Accept: 'application/json',
            },
          }),
        );
        this.token = response.data.access_token;
        this.expiry = new Date(Date.now() + response.data.expires_in * 1000);
        this.logger.log('Fetched client_credentials app token');
        return this.token;
      } catch (error) {
        this.logger.error(
          `Failed to fetch client_credentials token: ${error.response?.status ?? error.code ?? 'unknown'}`,
        );
        throw new UnauthorizedException('Failed to obtain app access token');
      } finally {
        this.inflight = null;
      }
    })();

    return this.inflight;
  }
}
