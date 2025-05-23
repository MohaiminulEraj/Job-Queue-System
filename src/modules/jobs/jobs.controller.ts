import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Query,
} from '@nestjs/common';
import { JobsService, JobType, JobPriority } from './jobs.service';
import { JobsMonitorService } from './jobs.monitor.service';
import { ApiOperation, ApiResponse, ApiTags, ApiBody, ApiQuery } from '@nestjs/swagger';
import { CreateJobDto } from './dto/create-job.dto';
import { JobStatus } from 'bull';

@ApiTags('Jobs')
@Controller('jobs')
export class JobsController {
  constructor(
    private readonly jobsService: JobsService,
    private readonly monitorService: JobsMonitorService,
  ) {}

  @Post('enqueue')
  @ApiOperation({ summary: 'Enqueue a new job with type and priority' })
  @ApiResponse({ status: 201, description: 'Job enqueued successfully' })
  @ApiBody({ type: CreateJobDto })
  async enqueueJob(
    @Body() jobDto: CreateJobDto,
  ) {
    const { jobType, data, ...options } = jobDto;
    const jobId = await this.jobsService.enqueueJob(
      jobType,
      data,
      options,
    );
    return {
      message: 'Job enqueued',
      jobId,
      jobType,
      priority: options.priority || 'normal'
    };
  }

  @Post(':type/enqueue')
  @ApiOperation({ summary: 'Enqueue a specific job type' })
  @ApiResponse({ status: 201, description: 'Job enqueued successfully' })
  async enqueueSpecificJob(
    @Param('type') type: JobType,
    @Body() body: { data: any; priority?: JobPriority; attempts?: number; delay?: number },
  ) {
    const { data, ...options } = body;
    const jobId = await this.jobsService.enqueueJob(
      type,
      data,
      options,
    );
    return {
      message: `${type} job enqueued`,
      jobId,
      jobType: type,
      priority: options.priority || 'normal'
    };
  }

  @Get(':id/status')
  @ApiOperation({ summary: 'Fetch the status and result of a specific job' })
  @ApiResponse({ status: 200, description: 'Job status returned' })
  async getJobStatus(@Param('id') id: string) {
    return await this.jobsService.getJobStatus(id);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get queue statistics' })
  @ApiResponse({ status: 200, description: 'Queue statistics returned' })
  async getQueueStats() {
    return await this.monitorService.getQueueStats();
  }

  @Get('health')
  @ApiOperation({ summary: 'Get queue health status' })
  @ApiResponse({ status: 200, description: 'Queue health returned' })
  async getQueueHealth() {
    return await this.monitorService.getQueueHealth();
  }

  @Get('workers')
  @ApiOperation({ summary: 'Get worker statistics' })
  @ApiResponse({ status: 200, description: 'Worker statistics returned' })
  async getWorkerStats() {
    return await this.monitorService.getWorkerStats();
  }

  @Get('failed')
  @ApiOperation({ summary: 'Get failed jobs' })
  @ApiResponse({ status: 200, description: 'Failed jobs returned' })
  async getFailedJobs() {
    return await this.monitorService.getFailedJobs();
  }

  @Get('pending')
  @ApiOperation({ summary: 'Get pending jobs' })
  @ApiResponse({ status: 200, description: 'Pending jobs returned' })
  async getPendingJobs() {
    return await this.monitorService.getPendingJobs();
  }

  @Get('active')
  @ApiOperation({ summary: 'Get active jobs' })
  @ApiResponse({ status: 200, description: 'Active jobs returned' })
  async getActiveJobs() {
    return await this.monitorService.getActiveJobs();
  }

  @Get(':type/jobs')
  @ApiOperation({ summary: 'Get jobs by type' })
  @ApiResponse({ status: 200, description: 'Jobs of specified type returned' })
  @ApiQuery({ name: 'status', enum: ['waiting', 'active', 'completed', 'failed', 'delayed'], required: false })
  @ApiQuery({ name: 'limit', required: false })
  async getJobsByType(
    @Param('type') type: JobType,
    @Query('status') status: JobStatus = 'waiting',
    @Query('limit') limit = 10,
  ) {
    return await this.monitorService.getJobsByType(type, status, +limit);
  }

  @Get(':id/progress')
  @ApiOperation({ summary: 'Get detailed job progress' })
  @ApiResponse({ status: 200, description: 'Job progress returned' })
  async getJobProgress(@Param('id') id: string) {
    return await this.monitorService.getJobProgress(id);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Cancel a job' })
  @ApiResponse({ status: 200, description: 'Job cancelled successfully' })
  async cancelJob(@Param('id') id: string) {
    await this.jobsService.cancelJob(id);
    return { message: 'Job cancelled successfully' };
  }
}
