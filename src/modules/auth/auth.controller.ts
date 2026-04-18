import { Controller, Get, Query, Body, Post, HttpCode, HttpStatus, Req, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Request, Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { TokenResponseDto, AuthorizationUrlDto, RefreshTokenDto } from './dto/token-response.dto';

const STATE_COOKIE = 'ml_oauth_state';
const STATE_COOKIE_MAX_AGE_MS = 10 * 60 * 1000; // 10 minutes

@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Get('authorize')
  @ApiOperation({
    summary: 'Get authorization URL',
    description: 'Returns the Mercado Libre authorization URL to initiate OAuth 2.0 flow. ' +
                 'Redirect your user to this URL to grant permissions to your application.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authorization URL generated successfully',
    type: AuthorizationUrlDto,
  })
  getAuthorizationUrl(@Res({ passthrough: true }) res: Response): AuthorizationUrlDto {
    const state = this.authService.generateSecureState();
    const authorization_url = this.authService.getAuthorizationUrl(state);

    this.setStateCookie(res, state);

    return {
      authorization_url,
      state,
    };
  }

  @Get('login')
  @ApiOperation({
    summary: 'Initiate OAuth 2.0 login',
    description: 'Redirects to Mercado Libre authorization page. This is a convenience endpoint ' +
                 'that directly redirects the user to the authorization URL.',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects to Mercado Libre authorization page',
  })
  login(@Res() res: Response): void {
    const state = this.authService.generateSecureState();
    const url = this.authService.getAuthorizationUrl(state);
    this.setStateCookie(res, state);
    res.redirect(url);
  }

  @Get('callback')
  @ApiOperation({
    summary: 'OAuth 2.0 callback endpoint',
    description: 'This endpoint receives the authorization code from Mercado Libre after user grants permissions. ' +
                 'The code is then exchanged for an access token. Configure this URL in your ML application settings.',
  })
  @ApiQuery({
    name: 'code',
    description: 'Authorization code returned by Mercado Libre',
    required: true,
    example: 'TG-123456789abcdef-123456789',
  })
  @ApiQuery({
    name: 'state',
    description: 'State parameter for CSRF validation (must match cookie)',
    required: true,
    example: 'abc123xyz456',
  })
  @ApiResponse({
    status: 302,
    description: 'Redirects back to frontend with auth result in hash fragment',
  })
  async callback(
    @Query('code') code: string,
    @Query('state') state: string,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('frontendUrl') || 'http://localhost:5173';
    const cookies = (req as Request & { cookies?: Record<string, string> }).cookies || {};
    const cookieState = cookies[STATE_COOKIE];

    this.clearStateCookie(res);

    if (!cookieState || !state || cookieState !== state) {
      return this.redirectError(res, frontendUrl, 'Parâmetro de estado inválido');
    }

    try {
      const tokenData = await this.authService.exchangeCodeForToken(code);

      // Redirect popup back to frontend origin with token in hash fragment
      // This avoids the window.opener=null problem caused by cross-origin redirects
      const authData = encodeURIComponent(JSON.stringify({
        type: 'ML_AUTH_SUCCESS',
        access_token: tokenData.access_token,
        user_id: String(tokenData.user_id),
        expires_in: tokenData.expires_in,
      }));

      res.redirect(`${frontendUrl}/#ml_auth=${authData}`);
    } catch {
      this.redirectError(res, frontendUrl, 'Falha na autenticação');
    }
  }

  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh access token',
    description: 'Exchanges a refresh token for a new access token. ' +
                 'Use this endpoint to extend the token expiration and keep your integration alive. ' +
                 'ML recommends refreshing tokens before they expire.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully refreshed access token',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid or expired refresh token',
  })
  async refreshToken(@Body() body: RefreshTokenDto): Promise<TokenResponseDto> {
    return this.authService.refreshAccessToken(body.refresh_token);
  }

  private setStateCookie(res: Response, state: string): void {
    res.cookie(STATE_COOKIE, state, {
      httpOnly: true,
      secure: this.isProduction(),
      sameSite: 'lax',
      maxAge: STATE_COOKIE_MAX_AGE_MS,
      path: '/',
    });
  }

  private clearStateCookie(res: Response): void {
    res.clearCookie(STATE_COOKIE, {
      httpOnly: true,
      secure: this.isProduction(),
      sameSite: 'lax',
      path: '/',
    });
  }

  private redirectError(res: Response, frontendUrl: string, message: string): void {
    const errorData = encodeURIComponent(JSON.stringify({
      type: 'ML_AUTH_ERROR',
      error: message,
    }));
    res.redirect(`${frontendUrl}/#ml_auth=${errorData}`);
  }

  private isProduction(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'production';
  }
}
