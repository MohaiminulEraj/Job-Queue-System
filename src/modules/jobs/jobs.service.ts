import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Job, Queue } from 'bull';

export type JobType = 'data-processing' | 'image-processing' | 'email-sending' | 'report-generation';
export type JobPriority = 'low' | 'normal' | 'high' | 'critical';

// Map string priorities to numeric values for Bull queue
const PRIORITY_MAP = {
  low: 5,
  normal: 10,
  high: 15,
  critical: 20,
};

@Injectable()
export class JobsService {
  constructor(@InjectQueue('job_queue') private readonly jobQueue: Queue) {}

  /**
   * Enqueue a job with type, data, and options.
   * @param jobType Type of job to process
   * @param data Payload for processing
   * @param options Job configuration options
   * @returns Job ID
   */
  async enqueueJob(
    jobType: JobType,
    data: any,
    options: {
      priority?: JobPriority;
      attempts?: number;
      delay?: number;
      removeOnComplete?: boolean;
    } = {},
  ) {
    const {
      priority = 'normal',
      attempts = 3,
      delay = 0,
      removeOnComplete = true,
    } = options;

    const job = await this.jobQueue.add(
      jobType, // Use job type as the Bull processor name
      data, // Job payload
      {
        priority: PRIORITY_MAP[priority], // Map string priority to number
        attempts,
        delay,
        backoff: {
          type: 'exponential',
          delay: 5000, // retry after 5 seconds
        },
        removeOnComplete, // automatically remove completed jobs
        removeOnFail: false, // keep failed jobs for debugging / monitoring
      },
    );
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
    return {
      id: job.id,
      type: job.name,
      status: state,
      result: returnValue,
      data: job.data,
      attempts: job.attemptsMade,
      timestamp: job.timestamp
    };
  }

  /**
   * Cancel a job by its ID
   */
  async cancelJob(jobId: string) {
    const job = await this.jobQueue.getJob(jobId);
    if (!job) {
      throw new NotFoundException(`Job with ID ${jobId} not found`);
    }
    await job.remove();
    return true;
  }
}
