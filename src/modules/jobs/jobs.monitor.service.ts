import { Injectable, Logger } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bull';
import { Queue, Job, JobStatus } from 'bull';
import { JobType } from './jobs.service';

@Injectable()
export class JobsMonitorService {
  private readonly logger = new Logger(JobsMonitorService.name);

  constructor(@InjectQueue('job_queue') private readonly jobQueue: Queue) {}

  async getQueueStats() {
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      this.jobQueue.getWaitingCount(),
      this.jobQueue.getActiveCount(),
      this.jobQueue.getCompletedCount(),
      this.jobQueue.getFailedCount(),
      this.jobQueue.getDelayedCount(),
    ]);

    // Get stats by job type
    const jobTypes: JobType[] = [
      'data-processing',
      'image-processing',
      'email-sending',
      'report-generation',
    ];

    const typeStats = await Promise.all(
      jobTypes.map(async (type) => {
        // Since Bull doesn't support filtering by job type in count methods directly,
        // we'll need to get the jobs and count them manually
        const waitingJobs = await this.jobQueue.getJobs(['waiting'], 0, 1000);
        const activeJobs = await this.jobQueue.getJobs(['active'], 0, 1000);
        const completedJobs = await this.jobQueue.getJobs(['completed'], 0, 1000);
        const failedJobs = await this.jobQueue.getJobs(['failed'], 0, 1000);

        // Count jobs of specific type
        const waiting = waitingJobs.filter(job => job.name === type).length;
        const active = activeJobs.filter(job => job.name === type).length;
        const completed = completedJobs.filter(job => job.name === type).length;
        const failed = failedJobs.filter(job => job.name === type).length;

        return {
          type,
          waiting,
          active,
          completed,
          failed,
          total: waiting + active + completed + failed,
        };
      }),
    );

    return {
      overall: {
        waiting,
        active,
        completed,
        failed,
        delayed,
        total: waiting + active + completed + failed + delayed,
      },
      byJobType: typeStats,
    };
  }

  async getWorkerStats() {
    const workers = await this.jobQueue.getWorkers();
    return workers.map(worker => ({
      id: worker.id,
      host: worker.host,
      pid: worker.pid,
      status: worker.status,
      name: worker.name || 'worker',
    }));
  }

  async getFailedJobs(limit = 10) {
    const failedJobs = await this.jobQueue.getFailed(0, limit);
    return failedJobs.map(job => ({
      id: job.id,
      type: job.name,
      data: job.data,
      failedReason: job.failedReason,
      timestamp: job.finishedOn,
      attempts: job.attemptsMade,
    }));
  }

  async getJobProgress(jobId: string) {
    const job = await this.jobQueue.getJob(jobId);
    if (!job) {
      return null;
    }

    const state = await job.getState();
    const progress = job.progress();
    const attempts = job.attemptsMade;

    return {
      id: job.id,
      type: job.name,
      state,
      progress,
      attempts,
      data: job.data,
      result: job.returnvalue,
      error: job.failedReason,
      processingTime: job.processedOn ? (job.finishedOn || Date.now()) - job.processedOn : null,
      createdAt: job.timestamp,
      processedAt: job.processedOn,
      finishedAt: job.finishedOn,
    };
  }

  async getJobsByType(type: JobType, status: JobStatus | string, limit = 10) {
    const validStatus = status as JobStatus;
    const jobs = await this.jobQueue.getJobs([validStatus], 0, limit);
    // Filter jobs by type
    const filteredJobs = jobs.filter(job => job.name === type);

    return filteredJobs.map(job => ({
      id: job.id,
      type: job.name,
      data: job.data,
      status: validStatus,
      progress: job.progress(),
      attempts: job.attemptsMade,
      createdAt: job.timestamp,
    }));
  }

  async getPendingJobs(limit = 10) {
    return this.getJobsByType('data-processing', 'waiting', limit);
  }

  async getActiveJobs(limit = 10) {
    return this.getJobsByType('data-processing', 'active', limit);
  }

  async getQueueHealth() {
    // Get queue metrics to determine health
    const stats = await this.getQueueStats();
    const failedJobs = await this.getFailedJobs(1);
    const workers = await this.getWorkerStats();

    // Basic health check
    const hasWorkers = workers.length > 0;
    const hasRecentFailures = failedJobs.some(
      job => job.timestamp && Date.now() - job.timestamp < 5 * 60 * 1000
    ); // Failures in last 5 minutes

    return {
      status: hasWorkers && !hasRecentFailures ? 'healthy' : 'unhealthy',
      workers: {
        count: workers.length,
        active: workers.filter(w => w.status === 'active').length,
      },
      queue: {
        size: stats.overall.waiting + stats.overall.delayed,
        processing: stats.overall.active,
        recentFailures: hasRecentFailures,
      },
      lastChecked: new Date().toISOString(),
    };
  }
}
