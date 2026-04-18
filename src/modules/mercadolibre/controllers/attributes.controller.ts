import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { MercadolibreService } from '../mercadolibre.service';
import { MlToken } from '../../../common/ml-token.decorator';

@ApiTags('Attributes')
@Controller('attributes')
export class AttributesController {
  constructor(private readonly mlService: MercadolibreService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all attributes',
    description: 'Returns a list of all available product attributes',
  })
  @ApiResponse({
    status: 200,
    description: 'List of attributes',
  })
  async getAttributes(@MlToken() userToken?: string) {
    return this.mlService.get('/attributes', undefined, userToken);
  }

  @Get(':attributeId')
  @ApiOperation({
    summary: 'Get attribute information',
    description: 'Returns detailed information about a specific attribute including valid values',
  })
  @ApiParam({
    name: 'attributeId',
    description: 'Attribute ID',
    example: 'BRAND',
  })
  @ApiResponse({
    status: 200,
    description: 'Attribute information',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'BRAND' },
        name: { type: 'string', example: 'Marca' },
        value_type: { type: 'string', example: 'list' },
        values: { type: 'array' },
      },
    },
  })
  async getAttribute(
    @Param('attributeId') attributeId: string,
    @MlToken() userToken?: string,
  ) {
    return this.mlService.get(`/attributes/${attributeId}`, undefined, userToken);
  }
}
