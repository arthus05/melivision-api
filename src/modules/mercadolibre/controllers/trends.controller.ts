import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { MercadolibreService } from '../mercadolibre.service';
import { MlToken } from '../../../common/ml-token.decorator';

@ApiTags('Trends')
@Controller('trends')
export class TrendsController {
  constructor(private readonly mlService: MercadolibreService) {}

  @Get(':siteId')
  @ApiOperation({
    summary: 'Get trending searches',
    description: 'Returns the most popular search trends for a specific site',
  })
  @ApiParam({
    name: 'siteId',
    description: 'Site ID',
    example: 'MLB',
  })
  @ApiResponse({
    status: 200,
    description: 'List of trending searches',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          keyword: { type: 'string', example: 'iPhone 13' },
          url: { type: 'string' },
        },
      },
    },
  })
  async getTrends(@Param('siteId') siteId: string, @MlToken() userToken?: string) {
    return this.mlService.get(`/trends/${siteId}`, undefined, userToken);
  }

  @Get(':siteId/categories/:categoryId')
  @ApiOperation({
    summary: 'Get category trends',
    description: 'Returns trending searches for a specific category',
  })
  @ApiParam({
    name: 'siteId',
    description: 'Site ID',
    example: 'MLB',
  })
  @ApiParam({
    name: 'categoryId',
    description: 'Category ID',
    example: 'MLB1051',
  })
  @ApiResponse({
    status: 200,
    description: 'Category trends',
  })
  async getCategoryTrends(
    @Param('siteId') siteId: string,
    @Param('categoryId') categoryId: string,
    @MlToken() userToken?: string,
  ) {
    return this.mlService.get(`/trends/${siteId}/${categoryId}`, undefined, userToken);
  }
}
