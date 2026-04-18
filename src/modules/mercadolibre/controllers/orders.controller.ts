import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBearerAuth } from '@nestjs/swagger';
import { MercadolibreService } from '../mercadolibre.service';

@ApiTags('Orders')
@ApiBearerAuth('access-token')
@Controller('orders')
export class OrdersController {
  constructor(private readonly mlService: MercadolibreService) {}

  @Get('received')
  @ApiOperation({
    summary: 'Get received orders (requires authentication)',
    description: 'Returns all orders received by the authenticated seller',
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
    example: 'date_desc',
  })
  @ApiResponse({
    status: 200,
    description: 'List of received orders',
    schema: {
      type: 'object',
      properties: {
        results: { type: 'array' },
        paging: { type: 'object' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
  })
  async getReceivedOrders(
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('sort') sort?: string,
  ) {
    // ML requires seller={user_id} — resolve from the forwarded user token.
    const me = await this.mlService.get<any>('/users/me');
    const params: any = { seller: me.id };

    if (limit) params.limit = limit;
    if (offset !== undefined) params.offset = offset;
    if (sort) params.sort = sort;

    return this.mlService.get('/orders/search', params);
  }

  @Get('received/:orderId')
  @ApiOperation({
    summary: 'Get order details (requires authentication)',
    description: 'Returns detailed information about a specific order',
  })
  @ApiParam({
    name: 'orderId',
    description: 'Order ID',
    example: '2000001234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Order details',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'number', example: 2000001234567890 },
        status: { type: 'string', example: 'paid' },
        date_created: { type: 'string' },
        buyer: { type: 'object' },
        seller: { type: 'object' },
        order_items: { type: 'array' },
        total_amount: { type: 'number' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - authentication required',
  })
  async getOrder(@Param('orderId') orderId: string) {
    return this.mlService.get(`/orders/${orderId}`);
  }

  @Get(':orderId/shipments')
  @ApiOperation({
    summary: 'Get order shipments',
    description: 'Returns shipping information for an order',
  })
  @ApiParam({
    name: 'orderId',
    description: 'Order ID',
    example: '2000001234567890',
  })
  @ApiResponse({
    status: 200,
    description: 'Shipment information',
  })
  async getOrderShipments(@Param('orderId') orderId: string) {
    return this.mlService.get(`/shipments/search?order_id=${orderId}`);
  }
}
