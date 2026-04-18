import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { MercadolibreService } from '../mercadolibre.service';
import { MlToken } from '../../../common/ml-token.decorator';

@ApiTags('Sites')
@Controller('sites')
export class SitesController {
  constructor(private readonly mlService: MercadolibreService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all Mercado Libre sites',
    description: 'Returns a list of all available Mercado Libre sites (countries/regions)',
  })
  @ApiResponse({
    status: 200,
    description: 'List of all sites',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'MLB' },
          name: { type: 'string', example: 'Brasil' },
        },
      },
    },
  })
  async getSites(@MlToken() userToken?: string) {
    return this.mlService.get('/sites', undefined, userToken);
  }

  @Get(':siteId')
  @ApiOperation({
    summary: 'Get site information',
    description: 'Returns detailed information about a specific Mercado Libre site',
  })
  @ApiParam({
    name: 'siteId',
    description: 'Site ID (e.g., MLB for Brazil, MLA for Argentina)',
    example: 'MLB',
  })
  @ApiResponse({
    status: 200,
    description: 'Site information',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'MLB' },
        name: { type: 'string', example: 'Brasil' },
        default_currency_id: { type: 'string', example: 'BRL' },
        countries: { type: 'array', items: { type: 'string' } },
      },
    },
  })
  async getSite(@Param('siteId') siteId: string, @MlToken() userToken?: string) {
    return this.mlService.get(`/sites/${siteId}`, undefined, userToken);
  }

  @Get(':siteId/categories')
  @ApiOperation({
    summary: 'Get site categories',
    description: 'Returns all main categories for a specific site',
  })
  @ApiParam({
    name: 'siteId',
    description: 'Site ID',
    example: 'MLB',
  })
  @ApiResponse({
    status: 200,
    description: 'List of categories',
  })
  async getSiteCategories(
    @Param('siteId') siteId: string,
    @MlToken() userToken?: string,
  ) {
    return this.mlService.get(`/sites/${siteId}/categories`, undefined, userToken);
  }
}
