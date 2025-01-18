import { Injectable, NotFoundException } from '@nestjs/common';
import { CreateJobDto } from './dto/create-job.dto';
import { UpdateJobDto } from './dto/update-job.dto';
import { InjectQueue } from '@nestjs/bull';
import { Job, Queue } from 'bull';

@Injectable()
export class JobsService {
  constructor(@InjectQueue('job_queue') private readonly jobQueue: Queue) {}

  /**
   * Enqueue a job with an optional priority.
   *  - data: payload for processing
   *  - priority: higher number means higher priority
   *  - attempts: number of retries on failure
   */
  async enqueueJob(data: any, priority = 1, attempts = 3) {
    const job = await this.jobQueue.add(data, {
      priority: priority,
      attempts: attempts,
      backoff: {
        type: 'fixed',
        delay: 5000, // retry after 5 seconds
      },
      removeOnComplete: true, // automatically remove completed jobs
      removeOnFail: false, // keep failed jobs for debugging / monitoring
    });
    return job.id;
  }

  /**
   * Retrieve job status and result.
   */
  async getJobStatus(jobId: string) {
    const job: Job | null = await this.jobQueue.getJob(jobId);
    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }
    const state = await job.getState();
    const returnValue = job.returnvalue; // result from the worker
    return { status: state, result: returnValue };
  }
}
