import { Process, Processor } from '@nestjs/bull';
import { Logger } from '@nestjs/common';
import { Job } from 'bull';
import { JobType } from './jobs.service';

@Processor('job_queue')
export class JobsProcessor {
  private readonly logger = new Logger(JobsProcessor.name);

  /**
   * Generic job processor - handles any job type
   */
  @Process()
  async handleJob(job: Job) {
    this.logger.log(`Processing generic job ${job.id} with type: ${job.name}`);
    await this.reportProgress(job, 10);
    return this.processJobByType(job);
  }

  /**
   * Process data-processing job type
   */
  @Process('data-processing')
  async handleDataProcessing(job: Job) {
    this.logger.log(`Processing data job ${job.id}`);
    try {
      await this.reportProgress(job, 10);

      // Simulate data processing steps
      await new Promise(resolve => setTimeout(resolve, 500));
      await this.reportProgress(job, 30);

      await new Promise(resolve => setTimeout(resolve, 500));
      await this.reportProgress(job, 60);

      await new Promise(resolve => setTimeout(resolve, 500));
      await this.reportProgress(job, 100);

      this.logger.log(`Data processing job ${job.id} completed successfully`);
      return { processed: true, result: `Processed data: ${job.data.input || 'no input'}` };
    } catch (error) {
      this.logger.error(`Data processing job ${job.id} failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process image-processing job type
   */
  @Process('image-processing')
  async handleImageProcessing(job: Job) {
    this.logger.log(`Processing image job ${job.id}`);
    try {
      await this.reportProgress(job, 20);

      // Simulate image processing steps
      await new Promise(resolve => setTimeout(resolve, 800));
      await this.reportProgress(job, 50);

      await new Promise(resolve => setTimeout(resolve, 800));
      await this.reportProgress(job, 100);

      this.logger.log(`Image processing job ${job.id} completed successfully`);
      return { processed: true, result: `Processed image: ${job.data.imagePath || 'unknown'}` };
    } catch (error) {
      this.logger.error(`Image processing job ${job.id} failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process email-sending job type
   */
  @Process('email-sending')
  async handleEmailSending(job: Job) {
    this.logger.log(`Sending email job ${job.id}`);
    try {
      await this.reportProgress(job, 50);

      // Simulate email sending
      await new Promise(resolve => setTimeout(resolve, 300));
      await this.reportProgress(job, 100);

      this.logger.log(`Email job ${job.id} completed successfully`);
      return {
        processed: true,
        result: `Email sent to: ${job.data.recipient || 'unknown recipient'}`
      };
    } catch (error) {
      this.logger.error(`Email job ${job.id} failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Process report-generation job type
   */
  @Process('report-generation')
  async handleReportGeneration(job: Job) {
    this.logger.log(`Generating report job ${job.id}`);
    try {
      await this.reportProgress(job, 25);

      // Simulate report generation steps
      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.reportProgress(job, 50);

      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.reportProgress(job, 75);

      await new Promise(resolve => setTimeout(resolve, 1000));
      await this.reportProgress(job, 100);

      this.logger.log(`Report generation job ${job.id} completed successfully`);
      return {
        processed: true,
        result: `Generated report: ${job.data.reportType || 'standard'}`,
        reportUrl: `/reports/${job.id}`
      };
    } catch (error) {
      this.logger.error(`Report generation job ${job.id} failed: ${error.message}`);
      throw error;
    }
  }

  /**
   * Update job progress
   */
  private async reportProgress(job: Job, percent: number) {
    await job.progress(percent);
    this.logger.debug(`Job ${job.id} progress: ${percent}%`);
  }

  /**
   * Fallback for processing unknown job types
   */
  private async processJobByType(job: Job) {
    const jobType = job.name as JobType;
    this.logger.log(`Processing job type: ${jobType}`);

    // Fallback logic for job types without specific processors
    switch (jobType) {
      default:
        await new Promise(resolve => setTimeout(resolve, 500));
        return {
          processed: true,
          message: `Processed with generic handler: ${jobType}`,
          data: job.data
        };
    }
  }
}
