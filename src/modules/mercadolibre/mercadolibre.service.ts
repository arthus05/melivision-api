import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { firstValueFrom } from 'rxjs';
import { AxiosRequestConfig } from 'axios';
import { AppTokenService } from '../auth/app-token.service';

// Strip undefined/null/''/NaN so Nest's ValidationPipe coercion doesn't leak
// sentinel values into ML query strings. With `enableImplicitConversion: true`,
// a missing `@Query('offset') offset?: number` arrives as NaN — which axios
// would serialize as `?offset=NaN`, and ML rejects it with a 400.
function cleanParams(
  params: Record<string, any> | undefined,
): Record<string, any> | undefined {
  if (!params) return undefined;
  const out: Record<string, any> = {};
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    if (typeof v === 'number' && Number.isNaN(v)) continue;
    out[k] = v;
  }
  return out;
}

@Injectable()
export class MercadolibreService {
  private readonly logger = new Logger(MercadolibreService.name);
  private readonly apiBase: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
    private readonly appTokenService: AppTokenService,
  ) {
    this.apiBase = this.configService.get<string>('mercadolibre.apiBase');
  }

  async request<T = any>(
    endpoint: string,
    options: AxiosRequestConfig = {},
    userToken?: string,
  ): Promise<T> {
    const url = `${this.apiBase}${endpoint}`;
    try {
      // ML requires a Bearer on virtually every endpoint (April 2025 policy).
      // Prefer the per-request user token; otherwise fall back to the app token.
      const accessToken = userToken ?? (await this.appTokenService.getToken());

      const config: AxiosRequestConfig = {
        ...options,
        headers: {
          Authorization: `Bearer ${accessToken}`,
          ...options.headers,
        },
      };

      const response = await firstValueFrom(
        this.httpService.request<T>({
          ...config,
          url,
        }),
      );

      return response.data;
    } catch (error) {
      this.handleError(error, endpoint);
    }
  }

  async get<T = any>(
    endpoint: string,
    params?: Record<string, any>,
    userToken?: string,
  ): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'GET',
        params: cleanParams(params),
      },
      userToken,
    );
  }

  async post<T = any>(endpoint: string, data?: any, userToken?: string): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'POST',
        data,
      },
      userToken,
    );
  }

  async put<T = any>(endpoint: string, data?: any, userToken?: string): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'PUT',
        data,
      },
      userToken,
    );
  }

  async delete<T = any>(endpoint: string, userToken?: string): Promise<T> {
    return this.request<T>(
      endpoint,
      {
        method: 'DELETE',
      },
      userToken,
    );
  }

  private handleError(error: any, endpoint: string): never {
    const statusCode = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
    const errorMessage = error.response?.data?.message || error.message;
    const errorDetails = error.response?.data;

    this.logger.error(`API Error on ${endpoint}: ${statusCode} ${errorMessage}`);

    if (statusCode === 401) {
      throw new HttpException(
        {
          statusCode: 401,
          message: 'Authentication failed. Please check your credentials or refresh your token.',
          error: 'Unauthorized',
          details: errorDetails,
        },
        HttpStatus.UNAUTHORIZED,
      );
    }

    if (statusCode === 429) {
      throw new HttpException(
        {
          statusCode: 429,
          message: 'Rate limit exceeded. Please try again later.',
          error: 'Too Many Requests',
          details: errorDetails,
        },
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    if (statusCode === 404) {
      throw new HttpException(
        {
          statusCode: 404,
          message: 'Resource not found',
          error: 'Not Found',
          details: errorDetails,
        },
        HttpStatus.NOT_FOUND,
      );
    }

    throw new HttpException(
      {
        statusCode,
        message: errorMessage || 'An error occurred while processing your request',
        error: error.response?.statusText || 'Internal Server Error',
        details: errorDetails,
      },
      statusCode,
    );
  }

  buildQueryString(params: Record<string, any>): string {
    const filteredParams = Object.entries(params)
      .filter(([_, value]) => value !== undefined && value !== null && value !== '')
      .reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {});

    const searchParams = new URLSearchParams(filteredParams as any);
    return searchParams.toString();
  }
}
