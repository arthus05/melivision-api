import { Controller, Get, Query, Redirect, Body, Post, HttpCode, HttpStatus, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { ConfigService } from '@nestjs/config';
import { AuthService } from './auth.service';
import { TokenResponseDto, AuthorizationUrlDto, RefreshTokenDto } from './dto/token-response.dto';

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
  getAuthorizationUrl(): AuthorizationUrlDto {
    const state = this.authService['generateSecureState']();
    const authorization_url = this.authService.getAuthorizationUrl(state);

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
  @Redirect()
  login() {
    const url = this.authService.getAuthorizationUrl();
    return { url };
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
    description: 'State parameter for security validation (optional)',
    required: false,
    example: 'abc123xyz456',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully exchanged code for access token',
    type: TokenResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Failed to exchange authorization code',
  })
  async callback(
    @Query('code') code: string,
    @Query('state') state?: string,
    @Res() res?: Response,
  ): Promise<void> {
    const frontendUrl = this.configService.get<string>('frontendUrl') || 'http://localhost:5173';

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

      res.setHeader('Content-Type', 'text/html');
      res.send(html);
    } catch (err) {
      const errorData = encodeURIComponent(JSON.stringify({
        type: 'ML_AUTH_ERROR',
        error: 'Falha na autenticação',
      }));

      res.redirect(`${frontendUrl}/#ml_auth=${errorData}`);
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

  @Get('status')
  @ApiOperation({
    summary: 'Check authentication status',
    description: 'Returns the current authentication status of the application',
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication status',
    schema: {
      type: 'object',
      properties: {
        authenticated: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Authenticated' },
      },
    },
  })
  getStatus() {
    const authenticated = this.authService.isAuthenticated();
    return {
      authenticated,
      message: authenticated ? 'Authenticated' : 'Not authenticated',
    };
  }

  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Clear tokens (logout)',
    description: 'Clears stored access and refresh tokens from the application',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully logged out',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Successfully logged out' },
      },
    },
  })
  logout() {
    this.authService.clearTokens();
    return { message: 'Successfully logged out' };
  }
}
