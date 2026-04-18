import { Injectable, Logger, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { randomBytes } from 'crypto';
import { TokenResponseDto } from './dto/token-response.dto';

/**
 * Stateless OAuth helper. Does NOT store user tokens — callers own them.
 * All methods return values; nothing is cached per-user.
 */
@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {}

  getAuthorizationUrl(state?: string): string {
    const clientId = this.configService.get<string>('mercadolibre.clientId');
    const redirectUri = this.configService.get<string>('mercadolibre.redirectUri');
    const authUrl = this.configService.get<string>('mercadolibre.authUrl');

    const secureState = state || this.generateSecureState();

    const params = new URLSearchParams({
      response_type: 'code',
      client_id: clientId,
      redirect_uri: redirectUri,
      state: secureState,
    });

    return `${authUrl}?${params.toString()}`;
  }

  async exchangeCodeForToken(code: string): Promise<TokenResponseDto> {
    try {
      const tokenUrl = this.configService.get<string>('mercadolibre.tokenUrl');
      const clientId = this.configService.get<string>('mercadolibre.clientId');
      const clientSecret = this.configService.get<string>('mercadolibre.clientSecret');
      const redirectUri = this.configService.get<string>('mercadolibre.redirectUri');

      const params = new URLSearchParams({
        grant_type: 'authorization_code',
        client_id: clientId,
        client_secret: clientSecret,
        code,
        redirect_uri: redirectUri,
      });

      const response = await firstValueFrom(
        this.httpService.post(tokenUrl, params.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
        }),
      );

      const tokenData = response.data;
      this.logger.log('Successfully exchanged authorization code for access token');

      return {
        access_token: tokenData.access_token,
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in,
        scope: tokenData.scope,
        user_id: tokenData.user_id,
        refresh_token: tokenData.refresh_token,
      };
    } catch (error) {
      this.logger.error(
        `Failed to exchange code for token: ${error.response?.status ?? error.code ?? 'unknown'}`,
      );
      throw new UnauthorizedException('Failed to obtain access token');
    }
  }

  async refreshAccessToken(refreshToken: string): Promise<TokenResponseDto> {
    if (!refreshToken) {
      throw new UnauthorizedException('No refresh token provided');
    }

    try {
      const tokenUrl = this.configService.get<string>('mercadolibre.tokenUrl');
      const clientId = this.configService.get<string>('mercadolibre.clientId');
      const clientSecret = this.configService.get<string>('mercadolibre.clientSecret');

      const params = new URLSearchParams({
        grant_type: 'refresh_token',
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
      });

      const response = await firstValueFrom(
        this.httpService.post(tokenUrl, params.toString(), {
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Accept: 'application/json',
          },
        }),
      );

      const tokenData = response.data;
      this.logger.log('Successfully refreshed access token');

      return {
        access_token: tokenData.access_token,
        token_type: tokenData.token_type,
        expires_in: tokenData.expires_in,
        scope: tokenData.scope,
        user_id: tokenData.user_id,
        refresh_token: tokenData.refresh_token,
      };
    } catch (error) {
      this.logger.error(
        `Failed to refresh token: ${error.response?.status ?? error.code ?? 'unknown'}`,
      );
      throw new UnauthorizedException('Failed to refresh access token');
    }
  }

  generateSecureState(): string {
    return randomBytes(16).toString('hex');
  }
}
