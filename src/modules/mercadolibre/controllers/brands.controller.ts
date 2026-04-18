import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { MercadolibreService } from '../mercadolibre.service';
import { MlToken } from '../../../common/ml-token.decorator';

@ApiTags('Brands')
@Controller('brands')
export class BrandsController {
  constructor(private readonly mlService: MercadolibreService) {}

  @Get(':brandId')
  @ApiOperation({
    summary: 'Get brand information',
    description: 'Returns detailed information about a specific brand',
  })
  @ApiParam({
    name: 'brandId',
    description: 'Brand ID',
    example: '52001',
  })
  @ApiResponse({
    status: 200,
    description: 'Brand information',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: '52001' },
        name: { type: 'string', example: 'Samsung' },
      },
    },
  })
  async getBrand(@Param('brandId') brandId: string, @MlToken() userToken?: string) {
    return this.mlService.get(`/brands/${brandId}`, undefined, userToken);
  }
}
