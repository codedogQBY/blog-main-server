import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import * as bodyParser from 'body-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.enableCors();
  app.use(bodyParser.json({ limit: '50mb' }));
  app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
  app.use(bodyParser.text({ type: 'text/plain' }));
  app.use((req, res, next) => {
    res.setHeader('Content-Length', '52428800'); // 50MB
    next();
  });
  app.useGlobalPipes(new ValidationPipe({ 
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: false,
    skipMissingProperties: true,
    skipNullProperties: true,
    skipUndefinedProperties: true
  }));
  await app.listen(process.env.PORT ?? 3001);
}
bootstrap();
