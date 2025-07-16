// src/main.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import * as express from 'express'; // Re-import express

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    rawBody: true, // Re-enabled for webhook signature verification
  });

  // Enable CORS
  app.enableCors({
    origin: 'http://localhost:3000', // Still set to your frontend's port (3000)
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // Enable global validation pipe for DTOs
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true, // Strip properties that are not defined in the DTO
    forbidNonWhitelisted: true, // Throw an error if non-whitelisted properties are present
    transform: true, // Automatically transform payloads to DTO instances
  }));

  // Re-enabled express.json() for parsing JSON request bodies
  app.use(express.json({
    verify: (req, res, buf) => {
      // Attach the raw body to the request object for webhook signature verification
      (req as any).rawBody = buf;
    },
  }));

  const port = process.env.PORT || 4000;
  await app.listen(port);
  console.log(`NestJS application is running on: http://localhost:${port}`);
}
bootstrap();
