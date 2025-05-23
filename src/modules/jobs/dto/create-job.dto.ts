import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsObject, IsOptional, IsNumber, IsBoolean } from 'class-validator';
import { JobType, JobPriority } from '../jobs.service';

export class CreateJobDto {
  @ApiProperty({
    description: 'Type of job to process',
    enum: ['data-processing', 'image-processing', 'email-sending', 'report-generation'],
    example: 'data-processing',
  })
  @IsEnum(['data-processing', 'image-processing', 'email-sending', 'report-generation'])
  @IsNotEmpty()
  jobType: JobType;

  @ApiProperty({
    description: 'Job data payload',
    example: { input: 'sample-data-123' },
  })
  @IsObject()
  @IsNotEmpty()
  data: any;

  @ApiProperty({
    description: 'Job priority level',
    enum: ['low', 'normal', 'high', 'critical'],
    default: 'normal',
  })
  @IsEnum(['low', 'normal', 'high', 'critical'])
  @IsOptional()
  priority?: JobPriority;

  @ApiProperty({
    description: 'Number of retry attempts on failure',
    example: 3,
    default: 3,
  })
  @IsNumber()
  @IsOptional()
  attempts?: number;

  @ApiProperty({
    description: 'Delay in milliseconds before processing',
    example: 0,
    default: 0,
  })
  @IsNumber()
  @IsOptional()
  delay?: number;

  @ApiProperty({
    description: 'Whether to remove job from queue after completion',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  removeOnComplete?: boolean;
}
