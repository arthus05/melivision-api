import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { MercadolibreService } from '../mercadolibre.service';
import { MlToken } from '../../../common/ml-token.decorator';

@ApiTags('Messages')
@ApiBearerAuth('access-token')
@Controller('messages')
export class MessagesController {
  constructor(private readonly mlService: MercadolibreService) {}

  @Get('received')
  @ApiOperation({
    summary: 'Get received messages (requires authentication)',
    description: 'Returns messages received by the authenticated user',
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
  @ApiResponse({
    status: 200,
    description: 'List of received messages',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
  })
  async getReceivedMessages(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @MlToken() userToken?: string,
  ) {
    const params: any = {};

    if (limit) params.limit = limit;
    if (offset !== undefined) params.offset = offset;

    return this.mlService.get('/messages/packs', params, userToken);
  }

  @Get('notifications')
  @ApiOperation({
    summary: 'Get notifications (requires authentication)',
    description: 'Returns notifications for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'List of notifications',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
  })
  async getNotifications(@MlToken() userToken?: string) {
    return this.mlService.get('/myfeeds', undefined, userToken);
  }

  @Get('bookmarks')
  @ApiOperation({
    summary: 'Get bookmarks/favorites (requires authentication)',
    description: 'Returns bookmarked items for the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'List of bookmarks',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
  })
  async getBookmarks(@MlToken() userToken?: string) {
    return this.mlService.get('/bookmarks', undefined, userToken);
  }
}
