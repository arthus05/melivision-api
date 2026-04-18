import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { MercadolibreService } from '../mercadolibre.service';
import { MlToken } from '../../../common/ml-token.decorator';

@ApiTags('Categories')
@Controller('categories')
export class CategoriesController {
  constructor(private readonly mlService: MercadolibreService) {}

  @Get(':categoryId')
  @ApiOperation({
    summary: 'Get category information',
    description: 'Returns detailed information about a specific category including settings and path from root',
  })
  @ApiParam({
    name: 'categoryId',
    description: 'Category ID',
    example: 'MLB1051',
  })
  @ApiResponse({
    status: 200,
    description: 'Category information',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'MLB1051' },
        name: { type: 'string', example: 'Celulares e Telefones' },
        path_from_root: { type: 'array' },
      },
    },
  })
  async getCategory(
    @Param('categoryId') categoryId: string,
    @MlToken() userToken?: string,
  ) {
    return this.mlService.get(`/categories/${categoryId}`, undefined, userToken);
  }

  @Get(':categoryId/children')
  @ApiOperation({
    summary: 'Get category children (subcategories)',
    description: 'Returns all subcategories of a specific category',
  })
  @ApiParam({
    name: 'categoryId',
    description: 'Category ID',
    example: 'MLB1051',
  })
  @ApiResponse({ status: 200, description: 'List of subcategories' })
  async getCategoryChildren(
    @Param('categoryId') categoryId: string,
    @MlToken() userToken?: string,
  ) {
    return this.mlService.get(`/categories/${categoryId}/children`, undefined, userToken);
  }

  @Get(':categoryId/attributes')
  @ApiOperation({
    summary: 'Get category attributes',
    description: 'Returns all required and optional attributes for listing items in this category. ' +
                 'Use this to know which fields are needed when creating an item.',
  })
  @ApiParam({
    name: 'categoryId',
    description: 'Category ID',
    example: 'MLB1051',
  })
  @ApiResponse({
    status: 200,
    description: 'List of category attributes',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'BRAND' },
          name: { type: 'string', example: 'Marca' },
          tags: { type: 'object' },
          required: { type: 'boolean', example: true },
        },
      },
    },
  })
  async getCategoryAttributes(
    @Param('categoryId') categoryId: string,
    @MlToken() userToken?: string,
  ) {
    return this.mlService.get(`/categories/${categoryId}/attributes`, undefined, userToken);
  }

  @Get(':categoryId/brands')
  @ApiOperation({
    summary: 'Get brands for a category',
    description: 'Returns all brands available for a specific category',
  })
  @ApiParam({
    name: 'categoryId',
    description: 'Category ID',
    example: 'MLB1051',
  })
  @ApiResponse({ status: 200, description: 'List of brands' })
  async getCategoryBrands(
    @Param('categoryId') categoryId: string,
    @MlToken() userToken?: string,
  ) {
    return this.mlService.get(`/categories/${categoryId}/brands`, undefined, userToken);
  }
}
