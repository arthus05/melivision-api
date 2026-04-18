import { Controller, Get, HttpException, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { MercadolibreService } from '../mercadolibre.service';
import { MlToken } from '../../../common/ml-token.decorator';

@ApiTags('Items')
@Controller('items')
export class ItemsController {
  constructor(private readonly mlService: MercadolibreService) {}

  @Get(':itemId')
  @ApiOperation({
    summary: 'Get item details',
    description: 'Returns complete information about a specific item/product listing',
  })
  @ApiParam({
    name: 'itemId',
    description: 'Item ID',
    example: 'MLB123456789',
  })
  @ApiResponse({
    status: 200,
    description: 'Item details',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'MLB123456789' },
        title: { type: 'string', example: 'iPhone 13 Pro Max 256GB' },
        price: { type: 'number', example: 7999.99 },
        available_quantity: { type: 'number', example: 10 },
        sold_quantity: { type: 'number', example: 150 },
        condition: { type: 'string', example: 'new' },
        thumbnail: { type: 'string' },
        pictures: { type: 'array' },
      },
    },
  })
  async getItem(@Param('itemId') itemId: string, @MlToken() userToken?: string) {
    try {
      return await this.mlService.get(`/items/${itemId}`, undefined, userToken);
    } catch (error) {
      // ML restricted /items/{id} in April 2025 — app-level tokens now get 403.
      // Compose a best-effort public view from endpoints that still work with
      // client_credentials so unauthenticated flows can still analyze items.
      const status = error instanceof HttpException ? error.getStatus() : 500;
      if (status !== 403) throw error;

      const [description, reviews, questions] = await Promise.all([
        this.mlService
          .get<any>(`/items/${itemId}/description`, undefined, userToken)
          .catch(() => null),
        this.mlService
          .get<any>(`/reviews/item/${itemId}`, undefined, userToken)
          .catch(() => null),
        this.mlService
          .get<any>(`/questions/search`, { item_id: itemId }, userToken)
          .catch(() => null),
      ]);

      return {
        id: itemId,
        _partial: true,
        _reason:
          'ML restricts /items/{id} to user-authenticated requests. Data below is composed from still-public endpoints.',
        description: description?.plain_text || description?.text || null,
        reviews: reviews
          ? {
              rating_average: reviews.rating_average,
              total: reviews.paging?.total,
              sample: (reviews.reviews || [])
                .slice(0, 5)
                .map((r: any) => ({
                  rate: r.rate,
                  title: r.title,
                  content: r.content,
                })),
            }
          : null,
        questions: questions
          ? {
              total: questions.total,
              sample: (questions.questions || [])
                .slice(0, 5)
                .map((q: any) => ({
                  text: q.text,
                  status: q.status,
                  answer_text: q.answer?.text,
                })),
            }
          : null,
      };
    }
  }

  @Get(':itemId/description')
  @ApiOperation({
    summary: 'Get item description',
    description: 'Returns the full description text of an item',
  })
  @ApiParam({
    name: 'itemId',
    description: 'Item ID',
    example: 'MLB123456789',
  })
  @ApiResponse({
    status: 200,
    description: 'Item description',
    schema: {
      type: 'object',
      properties: {
        plain_text: { type: 'string' },
        text: { type: 'string' },
      },
    },
  })
  async getItemDescription(
    @Param('itemId') itemId: string,
    @MlToken() userToken?: string,
  ) {
    return this.mlService.get(`/items/${itemId}/description`, undefined, userToken);
  }

  @Get(':itemId/questions')
  @ApiOperation({
    summary: 'Get item questions',
    description: 'Returns all questions asked about the item by potential buyers',
  })
  @ApiParam({
    name: 'itemId',
    description: 'Item ID',
    example: 'MLB123456789',
  })
  @ApiResponse({
    status: 200,
    description: 'List of questions',
    schema: {
      type: 'object',
      properties: {
        questions: { type: 'array' },
        total: { type: 'number' },
      },
    },
  })
  async getItemQuestions(
    @Param('itemId') itemId: string,
    @MlToken() userToken?: string,
  ) {
    return this.mlService.get(`/questions/search?item_id=${itemId}`, undefined, userToken);
  }

  @Get(':itemId/reviews')
  @ApiOperation({
    summary: 'Get item reviews',
    description: 'Returns buyer reviews and ratings for the item',
  })
  @ApiParam({
    name: 'itemId',
    description: 'Item ID',
    example: 'MLB123456789',
  })
  @ApiResponse({
    status: 200,
    description: 'Item reviews',
  })
  async getItemReviews(
    @Param('itemId') itemId: string,
    @MlToken() userToken?: string,
  ) {
    return this.mlService.get(`/reviews/item/${itemId}`, undefined, userToken);
  }

  @Get(':itemId/shipping_options')
  @ApiOperation({
    summary: 'Get shipping options',
    description: 'Returns available shipping options for the item to a specific location',
  })
  @ApiParam({
    name: 'itemId',
    description: 'Item ID',
    example: 'MLB123456789',
  })
  @ApiQuery({
    name: 'zip_code',
    description: 'Destination ZIP code',
    required: false,
    example: '01310-100',
  })
  @ApiQuery({
    name: 'quantity',
    description: 'Quantity to purchase',
    required: false,
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Shipping options',
    schema: {
      type: 'object',
      properties: {
        options: { type: 'array' },
        zip_code: { type: 'string' },
      },
    },
  })
  async getShippingOptions(
    @Param('itemId') itemId: string,
    @Query('zip_code') zipCode?: string,
    @Query('quantity') quantity?: number,
    @MlToken() userToken?: string,
  ) {
    const params: any = {};
    if (zipCode) params.zip_code = zipCode;
    if (quantity) params.quantity = quantity;

    const queryString = this.mlService.buildQueryString(params);
    return this.mlService.get(
      `/items/${itemId}/shipping_options${queryString ? '?' + queryString : ''}`,
      undefined,
      userToken,
    );
  }

  @Get(':itemId/visits')
  @ApiOperation({
    summary: 'Get item visit statistics',
    description: 'Returns visit statistics for the item (requires authentication)',
  })
  @ApiParam({
    name: 'itemId',
    description: 'Item ID',
    example: 'MLB123456789',
  })
  @ApiResponse({
    status: 200,
    description: 'Visit statistics',
  })
  async getItemVisits(@Param('itemId') itemId: string, @MlToken() userToken?: string) {
    return this.mlService.get(`/items/${itemId}/visits`, undefined, userToken);
  }
}
