import { Controller, Get, HttpException, Param, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery } from '@nestjs/swagger';
import { MercadolibreService } from '../mercadolibre.service';
import { MlToken } from '../../../common/ml-token.decorator';

@ApiTags('Search')
@Controller('search')
export class SearchController {
  constructor(private readonly mlService: MercadolibreService) {}

  @Get('sites/:siteId')
  @ApiOperation({
    summary: 'Search products',
    description:
      'Search for products/items in Mercado Libre. ' +
      'This is the main search endpoint that supports various filters. ' +
      'Note: For searches over 1000 results, use search_type=scan parameter.',
  })
  @ApiParam({
    name: 'siteId',
    description: 'Site ID to search in',
    example: 'MLB',
  })
  @ApiQuery({
    name: 'q',
    description: 'Search query (keywords)',
    required: false,
    example: 'iPhone 13',
  })
  @ApiQuery({
    name: 'category',
    description: 'Filter by category ID',
    required: false,
    example: 'MLB1051',
  })
  @ApiQuery({
    name: 'seller_id',
    description: 'Filter by seller ID',
    required: false,
    example: '123456789',
  })
  @ApiQuery({
    name: 'official_store_id',
    description: 'Filter by official store ID',
    required: false,
  })
  @ApiQuery({
    name: 'price_min',
    description: 'Minimum price',
    required: false,
    example: 100,
  })
  @ApiQuery({
    name: 'price_max',
    description: 'Maximum price',
    required: false,
    example: 5000,
  })
  @ApiQuery({
    name: 'shipping',
    description: 'Filter by shipping type (e.g., "free" for free shipping)',
    required: false,
    example: 'free',
  })
  @ApiQuery({
    name: 'condition',
    description: 'Filter by condition ("new" or "used")',
    required: false,
    example: 'new',
  })
  @ApiQuery({
    name: 'sort',
    description: 'Sort results (e.g., "price_asc", "price_desc")',
    required: false,
    example: 'price_asc',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of results per page (max 50)',
    required: false,
    example: 50,
  })
  @ApiQuery({
    name: 'offset',
    description: 'Results offset for pagination',
    required: false,
    example: 0,
  })
  @ApiQuery({
    name: 'search_type',
    description: 'Search type ("scan" for results over 1000)',
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: 'Search results',
    schema: {
      type: 'object',
      properties: {
        site_id: { type: 'string', example: 'MLB' },
        query: { type: 'string', example: 'iPhone 13' },
        paging: {
          type: 'object',
          properties: {
            total: { type: 'number', example: 1500 },
            limit: { type: 'number', example: 50 },
            offset: { type: 'number', example: 0 },
          },
        },
        results: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              id: { type: 'string' },
              title: { type: 'string' },
              price: { type: 'number' },
              thumbnail: { type: 'string' },
            },
          },
        },
        available_sorts: { type: 'array' },
        available_filters: { type: 'array' },
      },
    },
  })
  async searchProducts(
    @Param('siteId') siteId: string,
    @Query('q') q?: string,
    @Query('category') category?: string,
    @Query('seller_id') sellerId?: string,
    @Query('official_store_id') officialStoreId?: string,
    @Query('price_min') priceMin?: number,
    @Query('price_max') priceMax?: number,
    @Query('shipping') shipping?: string,
    @Query('condition') condition?: string,
    @Query('sort') sort?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @Query('search_type') searchType?: string,
    @MlToken() userToken?: string,
  ) {
    const requestedLimit = Math.min(Math.max(limit ?? 10, 1), 50);

    // Try the marketplace search first — returns items with prices, sellers,
    // shipping. Requires a user-level token (app-level gets 403 since April
    // 2025). Falls back to catalog search + buy-box enrichment when
    // marketplace search isn't available.
    const marketplaceResult = await this.tryMarketplaceSearch(
      siteId,
      {
        q, category, sellerId, officialStoreId, priceMin, priceMax,
        shipping, condition, sort, searchType,
        limit: requestedLimit, offset,
      },
      userToken,
    );

    if (marketplaceResult) return marketplaceResult;

    return this.catalogSearch(
      siteId,
      {
        q, category, priceMin, priceMax, shipping, condition, sort,
        limit: requestedLimit, offset,
      },
      userToken,
    );
  }

  private async tryMarketplaceSearch(
    siteId: string,
    opts: {
      q?: string; category?: string; sellerId?: string;
      officialStoreId?: string; priceMin?: number; priceMax?: number;
      shipping?: string; condition?: string; sort?: string;
      searchType?: string; limit: number; offset?: number;
    },
    userToken?: string,
  ) {
    const params: Record<string, any> = { limit: opts.limit };
    if (opts.q) params.q = opts.q;
    if (opts.category) params.category = opts.category;
    if (opts.sellerId) params.seller_id = opts.sellerId;
    if (opts.officialStoreId) params.official_store_id = opts.officialStoreId;
    if (opts.priceMin) params.price_min = opts.priceMin;
    if (opts.priceMax) params.price_max = opts.priceMax;
    if (opts.shipping) params.shipping = opts.shipping;
    if (opts.condition) params.condition = opts.condition;
    if (opts.sort) params.sort = opts.sort;
    if (opts.searchType) params.search_type = opts.searchType;
    if (opts.offset !== undefined) params.offset = opts.offset;

    try {
      const data = await this.mlService.get<any>(
        `/sites/${siteId}/search`,
        params,
        userToken,
      );
      return {
        site_id: siteId,
        query: opts.q,
        paging: data.paging,
        results: (data.results || []).map((item: any) => ({
          id: item.id,
          title: item.title,
          price: item.price,
          original_price: item.original_price,
          currency_id: item.currency_id,
          condition: item.condition,
          sold_quantity: item.sold_quantity,
          available_quantity: item.available_quantity,
          listing_type_id: item.listing_type_id,
          domain_id: item.domain_id,
          category_id: item.category_id,
          thumbnail: item.thumbnail,
          permalink: item.permalink,
          shipping: item.shipping
            ? {
                free_shipping: item.shipping.free_shipping,
                logistic_type: item.shipping.logistic_type,
              }
            : null,
          seller: item.seller
            ? { id: item.seller.id, nickname: item.seller.nickname }
            : null,
          attributes: (item.attributes || [])
            .filter((a: any) => a.value_name)
            .map((a: any) => ({
              id: a.id,
              name: a.name,
              value_name: a.value_name,
            })),
        })),
      };
    } catch (error) {
      const status =
        error instanceof HttpException ? error.getStatus() : 0;
      if (status === 403) return null; // fall back to catalog search
      throw error;
    }
  }

  private async catalogSearch(
    siteId: string,
    opts: {
      q?: string; category?: string; priceMin?: number; priceMax?: number;
      shipping?: string; condition?: string; sort?: string;
      limit: number; offset?: number;
    },
    userToken?: string,
  ) {
    const fetchLimit = Math.min(opts.limit * 2, 40);
    const params: any = {
      site_id: siteId,
      status: 'active',
      limit: fetchLimit,
    };
    if (opts.q) params.q = opts.q;
    if (opts.category) params.domain_id = opts.category;
    if (opts.offset !== undefined) params.offset = opts.offset;

    const catalog = await this.mlService.get<any>('/products/search', params, userToken);

    const enriched = await Promise.all(
      (catalog.results || []).map(async (product: any) => {
        let item: any = null;
        try {
          const itemsRes = await this.mlService.get<any>(
            `/products/${product.id}/items`,
            { limit: 1 },
            userToken,
          );
          item = itemsRes?.results?.[0] || null;
        } catch {
          // No buy-box winner.
        }

        const thumbnail =
          product.pictures?.[0]?.url ||
          product.pictures?.[0]?.secure_url ||
          undefined;

        const attrs = (product.attributes || [])
          .filter((a: any) => a.value_name)
          .map((a: any) => ({
            id: a.id,
            name: a.name,
            value_name: a.value_name,
          }));

        return {
          id: item?.item_id || product.id,
          catalog_product_id: product.id,
          title: product.name,
          price: item?.price ?? null,
          original_price: item?.original_price ?? null,
          currency_id: item?.currency_id ?? null,
          condition: item?.condition ?? null,
          available_quantity: item?.available_quantity ?? null,
          listing_type_id: item?.listing_type_id ?? null,
          domain_id: product.domain_id,
          thumbnail,
          permalink: item?.permalink || product.permalink || null,
          shipping: item?.shipping
            ? {
                free_shipping: item.shipping.free_shipping,
                logistic_type: item.shipping.logistic_type,
              }
            : null,
          seller: item?.seller_id ? { id: item.seller_id } : null,
          attributes: attrs,
        };
      }),
    );

    const withPrice = enriched.filter((r) => r.price != null);
    const withoutPrice = enriched.filter((r) => r.price == null);
    let results = [...withPrice, ...withoutPrice];

    if (opts.priceMin)
      results = results.filter((r) => !r.price || r.price >= opts.priceMin);
    if (opts.priceMax)
      results = results.filter((r) => !r.price || r.price <= opts.priceMax);
    if (opts.condition)
      results = results.filter(
        (r) => !r.condition || r.condition === opts.condition,
      );
    if (opts.shipping === 'free') {
      results = results.filter((r) => r.shipping?.free_shipping);
    }
    if (opts.sort === 'price_asc') {
      results.sort((a, b) => (a.price ?? Infinity) - (b.price ?? Infinity));
    } else if (opts.sort === 'price_desc') {
      results.sort(
        (a, b) => (b.price ?? -Infinity) - (a.price ?? -Infinity),
      );
    }

    results = results.slice(0, opts.limit);

    return {
      site_id: siteId,
      query: opts.q,
      paging: catalog.paging,
      results,
    };
  }

  @Get('sites/:siteId/search_suggestions')
  @ApiOperation({
    summary: 'Get search suggestions',
    description: 'Returns search query suggestions based on partial input',
  })
  @ApiParam({
    name: 'siteId',
    description: 'Site ID',
    example: 'MLB',
  })
  @ApiQuery({
    name: 'q',
    description: 'Partial search query',
    required: true,
    example: 'ipho',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of suggestions',
    required: false,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Search suggestions',
    schema: {
      type: 'object',
      properties: {
        suggested_queries: { type: 'array', items: { type: 'object' } },
      },
    },
  })
  async getSearchSuggestions(
    @Param('siteId') siteId: string,
    @Query('q') q: string,
    @Query('limit') limit?: number,
    @MlToken() userToken?: string,
  ) {
    const params: any = { q };
    if (limit) params.limit = limit;

    return this.mlService.get(`/sites/${siteId}/autosuggest`, params, userToken);
  }

  @Get('products')
  @ApiOperation({
    summary: 'Search catalog products',
    description:
      'Search for products in the Mercado Libre catalog. ' +
      'The catalog contains products created by ML with complete datasheets.',
  })
  @ApiQuery({
    name: 'site_id',
    description: 'Site ID',
    required: true,
    example: 'MLB',
  })
  @ApiQuery({
    name: 'q',
    description: 'Search query with product details',
    required: false,
    example: 'Samsung Galaxy S21 64GB Black',
  })
  @ApiQuery({
    name: 'product_identifier',
    description: 'Product identifier (GTIN, EAN, UPC, ISBN)',
    required: false,
    example: '7891234567890',
  })
  @ApiQuery({
    name: 'domain_id',
    description: 'Domain ID to filter results',
    required: false,
  })
  @ApiQuery({
    name: 'status',
    description: 'Product status filter',
    required: false,
    example: 'active',
  })
  @ApiQuery({
    name: 'limit',
    description: 'Number of results',
    required: false,
    example: 20,
  })
  @ApiQuery({
    name: 'offset',
    description: 'Results offset',
    required: false,
    example: 0,
  })
  @ApiResponse({
    status: 200,
    description: 'Product search results from catalog',
  })
  async searchCatalogProducts(
    @Query('site_id') siteId: string,
    @Query('q') q?: string,
    @Query('product_identifier') productIdentifier?: string,
    @Query('domain_id') domainId?: string,
    @Query('status') status?: string,
    @Query('limit') limit?: number,
    @Query('offset') offset?: number,
    @MlToken() userToken?: string,
  ) {
    const params: any = { site_id: siteId };

    if (q) params.q = q;
    if (productIdentifier) params.product_identifier = productIdentifier;
    if (domainId) params.domain_id = domainId;
    if (status) params.status = status;
    if (limit) params.limit = limit;
    if (offset !== undefined) params.offset = offset;

    return this.mlService.get('/products/search', params, userToken);
  }

  @Get('products/:productId')
  @ApiOperation({
    summary: 'Get catalog product details',
    description: 'Returns detailed information about a catalog product',
  })
  @ApiParam({
    name: 'productId',
    description: 'Product ID from catalog',
    example: 'MLB123456',
  })
  @ApiResponse({
    status: 200,
    description: 'Catalog product details',
  })
  async getProduct(
    @Param('productId') productId: string,
    @MlToken() userToken?: string,
  ) {
    return this.mlService.get(`/products/${productId}`, undefined, userToken);
  }
}
