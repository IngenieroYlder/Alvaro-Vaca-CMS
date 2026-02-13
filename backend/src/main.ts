import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { join } from 'path';
import compression from 'compression';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Enable compression
  app.use(compression());

  // Increase payload limit
  const bodyParser = require('body-parser');
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));

  // Enable CORS for API requests from other domains
  app.enableCors();

  // SEO: X-Robots-Tag header (was flagged as missing in audit)
  app.use((req: any, res: any, next: any) => {
    res.setHeader('X-Robots-Tag', 'index, follow');
    next();
  });

  // Cookie Parser
  const cookieParser = require('cookie-parser');
  app.use(cookieParser());

  // Configure View Engine (Handlebars SSR)
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  // Register Handlebars Partials
  const hbs = require('hbs');
  hbs.registerPartials(join(__dirname, '..', 'views', 'partials'));

  // Helpers
  hbs.registerHelper('formatDate', (date: any) => {
    if (!date) return '';
    const d = new Date(date);
    // Use es-CO locale
    return isNaN(d.getTime()) ? date : d.toLocaleDateString('es-CO', { year: 'numeric', month: 'long', day: 'numeric' });
  });

  hbs.registerHelper('sum', (a: number, b: number) => {
    return a + b;
  });

  hbs.registerHelper('firstChar', (text: any) => {
    if (!text || typeof text !== 'string') return '';
    return text.charAt(0).toUpperCase();
  });

  hbs.registerHelper('eq', (a: any, b: any) => {
    return a === b;
  });

  hbs.registerHelper('or', function (a: any, b: any) {
    return a || b;
  });

  // Serve static assets (images, CSS for public site)
  app.useStaticAssets(join(__dirname, '..', 'public'), {
    maxAge: 31536000000, // 1 year (in milliseconds)
    setHeaders: (res, path) => {
      // Cache images/fonts effectively
      if (path.endsWith('.jpg') || path.endsWith('.png') || path.endsWith('.webp') || path.endsWith('.css') || path.endsWith('.js')) {
        res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      }
      // Do not cache HTML files (if any served statically) to ensure updates are seen
      if (path.endsWith('.html')) {
        res.setHeader('Cache-Control', 'public, max-age=0');
      }
    },
  });

  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
