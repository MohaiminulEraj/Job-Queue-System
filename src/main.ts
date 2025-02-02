import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe as VP } from './common/pipes/validation.pipe';
import {
  HttpStatus,
  UnprocessableEntityException,
  ValidationPipe,
  Logger,
} from '@nestjs/common';
import { Queue } from 'bull';
import { getQueueToken } from '@nestjs/bull';
import { ExpressAdapter } from '@bull-board/express';
import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const configService = app.get(ConfigService);
  const logger = new Logger('Bootstrap');
  app.setGlobalPrefix('api');
  app.useGlobalPipes(new VP());
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      errorHttpStatusCode: HttpStatus.UNPROCESSABLE_ENTITY,
      transform: true,
      dismissDefaultMessages: true,
      exceptionFactory: (errors) => new UnprocessableEntityException(errors),
    }),
  );

  const options = {
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    preflightContinue: false,
    optionsSuccessStatus: 204,
    credentials: true,
  };

  app.enableCors(options);

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('Distributed Job Queue System')
    .setDescription('API documentation for the NestJS Redis job queue system')
    .setVersion('1.0')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('docs', app, document);

  // Retrieve the Bull queue instance from Nest's DI container.
  // Ensure that your queue is registered in your JobsModule
  // and that its name is 'job_queue'. Otherwise, adjust the queue name.
  const jobQueue = app.get<Queue>(getQueueToken('job_queue'));

  // Create an Express adapter for Bull Board
  const serverAdapter = new ExpressAdapter();
  // Set the base path for the Bull Board UI
  serverAdapter.setBasePath('/admin/queues');

  // Create the Bull Board instance and register your queue
  createBullBoard({
    queues: [new BullAdapter(jobQueue)],
    serverAdapter,
  });

  // Mount the Bull Board router on the specified path
  app.use('/admin/queues', serverAdapter.getRouter());
  const PORT = configService.get<number>('APP_PORT', 5000);
  await app.listen(PORT);

  logger.log(`Server is running on http://localhost:${PORT}`);
  logger.log(`Swagger UI is available on http://localhost:${PORT}/docs`);
  logger.log(
    `Bull Board UI is available on http://localhost:${PORT}/admin/queues`,
  );
}
bootstrap();
