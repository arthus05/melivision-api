import { INestApplication, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

export function configureApp(app: INestApplication): void {
  // Security headers are applied in main.ts / api/index.ts (helmet)

  // Enable CORS
  app.enableCors({
    origin: ['http://localhost:5173', 'https://meli-chat-web.vercel.app'],
    credentials: true,
  });

  // Global validation pipe
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  // Global prefix
  app.setGlobalPrefix('api');

  // Swagger — use CDN assets so static files are not served through the serverless function
  const config = new DocumentBuilder()
    .setTitle('Meli Vision API Integration')
    .setDescription(
      `A NestJS API integration with Mercado Libre marketplace.
      This API provides access to various Mercado Libre resources including items,
      categories, users, orders, and more.`,
    )
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter your Mercado Libre access token',
        in: 'header',
      },
      'access-token',
    )
    .addTag('Authentication', 'OAuth 2.0 authentication endpoints')
    .addTag('Sites', 'Mercado Libre sites information')
    .addTag('Locations', 'Countries, states, and cities')
    .addTag('Categories', 'Product categories and attributes')
    .addTag('Items', 'Product items and listings')
    .addTag('Search', 'Search for products')
    .addTag('Users', 'User information and reputation')
    .addTag('Orders', 'Order management (requires authentication)')
    .addTag('Messages', 'Messaging (requires authentication)')
    .addTag('Currencies', 'Currency information')
    .addTag('Attributes', 'Product attributes')
    .addTag('Brands', 'Brand information')
    .addTag('Trends', 'Market trends')
    .addTag('Health', 'API health check')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document, {
    customSiteTitle: 'Mercado Libre API Docs',
    // Use CDN assets instead of locally-served files to avoid MIME type issues on serverless
    customCssUrl: 'https://unpkg.com/swagger-ui-dist@5/swagger-ui.css',
    customJs: [
      'https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js',
      'https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js',
    ],
    customCss: `
      .swagger-ui .topbar { display: none }
      .swagger-ui .info { margin: 50px 0; }
      .swagger-ui .info .title { font-size: 36px; }
    `,
  });
}
