import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { MercadolibreService } from '../mercadolibre.service';
import { MlToken } from '../../../common/ml-token.decorator';

@ApiTags('Users')
@Controller('users')
export class UsersController {
  constructor(private readonly mlService: MercadolibreService) {}

  @Get(':userId')
  @ApiOperation({
    summary: 'Get user information',
    description: 'Returns public information about a user/seller',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: '123456789',
  })
  @ApiResponse({
    status: 200,
    description: 'User information',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 123456789 },
        nickname: { type: 'string', example: 'SELLER123' },
        registration_date: { type: 'string' },
        country_id: { type: 'string', example: 'BR' },
        seller_reputation: { type: 'object' },
      },
    },
  })
  async getUser(@Param('userId') userId: string, @MlToken() userToken?: string) {
    return this.mlService.get(`/users/${userId}`, undefined, userToken);
  }

  @Get(':userId/reputation')
  @ApiOperation({
    summary: 'Get user reputation',
    description: 'Returns detailed reputation information about a seller',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: '123456789',
  })
  @ApiResponse({
    status: 200,
    description: 'User reputation details',
    schema: {
      type: 'object',
      properties: {
        user_id: { type: 'number' },
        power_seller_status: { type: 'string' },
        transactions: { type: 'object' },
        ratings: { type: 'object' },
      },
    },
  })
  async getUserReputation(
    @Param('userId') userId: string,
    @MlToken() userToken?: string,
  ) {
    return this.mlService.get(`/users/${userId}/reputation`, undefined, userToken);
  }

  @Get(':userId/items/search')
  @ApiOperation({
    summary: 'Search user items',
    description: 'Returns all active items listed by a specific seller. ' +
                 'For searches over 1000 results, use search_type=scan without offset.',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: '123456789',
  })
  @ApiQuery({
    name: 'status',
    description: 'Filter by item status',
    required: false,
    example: 'active',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of results',
    required: false,
    example: 50,
  })
  @ApiQuery({
    name: 'offset',
    description: 'Results offset',
    required: false,
    example: 0,
  })
  @ApiQuery({
    name: 'sort',
    description: 'Sort order',
    required: false,
    example: 'start_time_desc',
  })
  @ApiQuery({
    name: 'search_type',
    description: 'Use "scan" for >1000 results',
    required: false,
  })
  @ApiQuery({
    name: 'sku',
    description: 'Filter by SKU (seller_custom_field)',
    required: false,
  })
  @ApiQuery({
    name: 'seller_sku',
    description: 'Filter by seller SKU',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'List of user items',
    schema: {
      type: 'object',
      properties: {
        results: { type: 'array' },
        paging: { type: 'object' },
      },
    },
  })
  async getUserItems(
    @Param('userId') userId: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('sort') sort?: string,
    @Query('search_type') searchType?: string,
    @Query('sku') sku?: string,
    @Query('seller_sku') sellerSku?: string,
    @MlToken() userToken?: string,
  ) {
    const params: any = {};

    if (status) params.status = status;
    if (limit) params.limit = limit;
    if (offset !== undefined) params.offset = offset;
    if (sort) params.sort = sort;
    if (searchType) params.search_type = searchType;
    if (sku) params.sku = sku;
    if (sellerSku) params.seller_sku = sellerSku;

    return this.mlService.get(`/users/${userId}/items/search`, params, userToken);
  }

  @Get(':userId/feedback')
  @ApiOperation({
    summary: 'Get user feedback',
    description: 'Returns feedback received by a user as a seller',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: '123456789',
  })
  @ApiResponse({
    status: 200,
    description: 'User feedback',
  })
  async getUserFeedback(
    @Param('userId') userId: string,
    @MlToken() userToken?: string,
  ) {
    return this.mlService.get(`/users/${userId}/brands`, undefined, userToken);
  }

  @Get(':userId/listings')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get user listings (requires authentication)',
    description: 'Returns all listings for the authenticated user',
  })
  @ApiParam({
    name: 'userId',
    description: 'User ID',
    example: '123456789',
  })
  @ApiResponse({
    status: 200,
    description: 'User listings',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
  })
  async getUserListings(
    @Param('userId') userId: string,
    @MlToken() userToken?: string,
  ) {
    return this.mlService.get(`/users/${userId}/listings`, undefined, userToken);
  }

  @Get('me')
  @ApiBearerAuth('access-token')
  @ApiOperation({
    summary: 'Get current authenticated user',
    description: 'Returns information about the currently authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Current user information',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
  })
  async getCurrentUser(@MlToken() userToken?: string) {
    return this.mlService.get('/users/me', undefined, userToken);
  }
}
