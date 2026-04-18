import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { MercadolibreService } from '../mercadolibre.service';
import { MlToken } from '../../../common/ml-token.decorator';

@ApiTags('Currencies')
@Controller('currencies')
export class CurrenciesController {
  constructor(private readonly mlService: MercadolibreService) {}

  @Get()
  @ApiOperation({
    summary: 'Get all currencies',
    description: 'Returns a list of all available currencies in Mercado Libre',
  })
  @ApiResponse({
    status: 200,
    description: 'List of currencies',
    schema: {
      type: 'array',
      items: {
        type: 'object',
        properties: {
          id: { type: 'string', example: 'BRL' },
          name: { type: 'string', example: 'Real brasileiro' },
          symbol: { type: 'string', example: 'R$' },
        },
      },
    },
  })
  async getCurrencies(@MlToken() userToken?: string) {
    return this.mlService.get('/currencies', undefined, userToken);
  }

  @Get(':currencyId')
  @ApiOperation({
    summary: 'Get currency information',
    description: 'Returns detailed information about a specific currency',
  })
  @ApiParam({
    name: 'currencyId',
    description: 'Currency ID (e.g., BRL, USD, ARS)',
    example: 'BRL',
  })
  @ApiResponse({
    status: 200,
    description: 'Currency information',
    schema: {
      type: 'object',
      properties: {
        id: { type: 'string', example: 'BRL' },
        description: { type: 'string', example: 'Real brasileiro' },
        symbol: { type: 'string', example: 'R$' },
        decimal_places: { type: 'number', example: 2 },
      },
    },
  })
  async getCurrency(
    @Param('currencyId') currencyId: string,
    @MlToken() userToken?: string,
  ) {
    return this.mlService.get(`/currencies/${currencyId}`, undefined, userToken);
  }
}
