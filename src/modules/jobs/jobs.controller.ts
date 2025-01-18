import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
} from '@nestjs/common';
import { JobsService } from './jobs.service';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

@ApiTags('Jobs')
@Controller('jobs')
export class JobsController {
  constructor(private readonly jobsService: JobsService) {}

  @Post('enqueue')
  @ApiOperation({ summary: 'Enqueue a new job with an optional priority' })
  @ApiResponse({ status: 201, description: 'Job enqueued successfully' })
  async enqueueJob(
    @Body() body: { payload: any; priority?: number; attempts?: number },
  ) {
    const { payload, priority = 1, attempts = 3 } = body;
    const jobId = await this.jobsService.enqueueJob(
      payload,
      priority,
      attempts,
    );
    return { message: 'Job enqueued', jobId };
  }

  @Get(':id/status')
  @ApiOperation({
    summary: 'Fetch the status and result (if any) of a specific job',
  })
  @ApiResponse({ status: 200, description: 'Job status returned' })
  async getJobStatus(@Param('id') id: string) {
    return await this.jobsService.getJobStatus(id);
  }
}
