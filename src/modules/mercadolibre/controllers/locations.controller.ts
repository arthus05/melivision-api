import { Controller, Get, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { MercadolibreService } from '../mercadolibre.service';
import { MlToken } from '../../../common/ml-token.decorator';

@ApiTags('Locations')
@Controller()
export class LocationsController {
  constructor(private readonly mlService: MercadolibreService) {}

  @Get('countries')
  @ApiOperation({
    summary: 'Get all countries',
    description: 'Returns a list of all countries available in Mercado Libre',
  })
  @ApiResponse({ status: 200, description: 'List of countries' })
  async getCountries(@MlToken() userToken?: string) {
    return this.mlService.get('/countries', undefined, userToken);
  }

  @Get('countries/:countryId')
  @ApiOperation({
    summary: 'Get country information',
    description: 'Returns detailed information about a specific country',
  })
  @ApiParam({
    name: 'countryId',
    description: 'Country ID (e.g., BR for Brazil)',
    example: 'BR',
  })
  @ApiResponse({ status: 200, description: 'Country information' })
  async getCountry(
    @Param('countryId') countryId: string,
    @MlToken() userToken?: string,
  ) {
    return this.mlService.get(`/countries/${countryId}`, undefined, userToken);
  }

  @Get('countries/:countryId/states')
  @ApiOperation({
    summary: 'Get states of a country',
    description: 'Returns all states/provinces of a specific country',
  })
  @ApiParam({
    name: 'countryId',
    description: 'Country ID',
    example: 'BR',
  })
  @ApiResponse({ status: 200, description: 'List of states' })
  async getCountryStates(
    @Param('countryId') countryId: string,
    @MlToken() userToken?: string,
  ) {
    return this.mlService.get(`/countries/${countryId}/states`, undefined, userToken);
  }

  @Get('states/:stateId')
  @ApiOperation({
    summary: 'Get state information',
    description: 'Returns detailed information about a specific state',
  })
  @ApiParam({
    name: 'stateId',
    description: 'State ID',
    example: 'BR-SP',
  })
  @ApiResponse({ status: 200, description: 'State information' })
  async getState(@Param('stateId') stateId: string, @MlToken() userToken?: string) {
    return this.mlService.get(`/states/${stateId}`, undefined, userToken);
  }

  @Get('states/:stateId/cities')
  @ApiOperation({
    summary: 'Get cities of a state',
    description: 'Returns all cities of a specific state',
  })
  @ApiParam({
    name: 'stateId',
    description: 'State ID',
    example: 'BR-SP',
  })
  @ApiResponse({ status: 200, description: 'List of cities' })
  async getStateCities(
    @Param('stateId') stateId: string,
    @MlToken() userToken?: string,
  ) {
    return this.mlService.get(`/states/${stateId}/cities`, undefined, userToken);
  }

  @Get('cities/:cityId')
  @ApiOperation({
    summary: 'Get city information',
    description: 'Returns detailed information about a specific city',
  })
  @ApiParam({
    name: 'cityId',
    description: 'City ID',
    example: 'BR-SP-44',
  })
  @ApiResponse({ status: 200, description: 'City information' })
  async getCity(@Param('cityId') cityId: string, @MlToken() userToken?: string) {
    return this.mlService.get(`/cities/${cityId}`, undefined, userToken);
  }
}
