import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from '../src/app.module';
import * as bodyParser from 'body-parser';
import { VercelRequest, VercelResponse } from '@vercel/node';

let app: any;

async function bootstrap() {
  if (!app) {
    app = await NestFactory.create(AppModule);
    app.enableCors({
      origin: '*',
      methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
      allowedHeaders: 'Content-Type, Authorization, X-Requested-With, Accept, Origin',
    });
    app.use(bodyParser.json({ limit: '50mb' }));
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
    app.use(bodyParser.text({ type: 'text/plain' }));
    app.useGlobalPipes(new ValidationPipe({ 
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
      skipMissingProperties: true,
      skipNullProperties: true,
      skipUndefinedProperties: true
    }));
    
    await app.init();
  }
  return app;
}

export default async function handler(req: VercelRequest, res: VercelResponse) {
  try {
    const app = await bootstrap();
    const server = app.getHttpServer();
    
    // 透传请求到 NestJS 应用
    return new Promise((resolve, reject) => {
      server.emit('request', req, res);
      res.on('finish', resolve);
      res.on('error', reject);
    });
  } catch (error) {
    console.error('NestJS Bootstrap Error:', error);
    return res.status(500).json({ 
      error: 'Server initialization failed',
      message: error.message 
    });
  }
}