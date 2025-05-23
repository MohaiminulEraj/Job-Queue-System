import { Module } from '@nestjs/common';
import { JobsService } from './jobs.service';
import { JobsController } from './jobs.controller';
import { BullModule } from '@nestjs/bull';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { JobsProcessor } from './jobs.processor';
import { JobsMonitorService } from './jobs.monitor.service';

@Module({
  imports: [
    // Import the BullModule with async configuration
    BullModule.registerQueueAsync({
      name: 'job_queue',
      useFactory: async (configService: ConfigService) => ({
        redis: {
          host: configService.get<string>('REDIS_HOST', 'localhost'), // Fallback to 'localhost'
          port: configService.get<number>('REDIS_PORT', 6379), // Fallback to 6379
        },
        defaultJobOptions: {
          removeOnComplete: true,
          removeOnFail: false,
          attempts: 3,
          backoff: {
            type: 'exponential',
            delay: 1000,
          },
        },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [JobsController],
  providers: [JobsService, JobsProcessor, JobsMonitorService],
})
export class JobsModule {}
