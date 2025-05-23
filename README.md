# Distributed Job Queue System

<p align="center">
  <img src="https://images.icon-icons.com/2699/PNG/512/nestjs_logo_icon_169927.png" width="120" alt="Nest Logo" />
  <img src="https://www.clipartmax.com/png/middle/130-1307069_redis-logo-image-sizes-redis-db.png" width="120" alt="Redis Logo" style="background-color: #DC382C; padding: 10px; margin: 0 20px;" />
  <img src="https://raw.githubusercontent.com/OptimalBits/bull/master/support/logo%402x.png" width="120" alt="Bull Logo" />
</p>

A scalable, distributed job queue system built with NestJS, Redis, and Bull that can handle tasks across multiple worker nodes in a cloud environment.

## 📋 Features

- **Job Types**: Support for multiple job types with dedicated processors
- **Prioritization**: Flexible job prioritization (low, normal, high, critical)
- **Status Tracking**: Real-time job status monitoring (pending, processing, completed, failed)
- **Retry Mechanism**: Configurable retry attempts with exponential backoff
- **Progress Tracking**: Real-time job progress reporting
- **Health Monitoring**: Queue and worker health metrics
- **Distributed Processing**: Support for multiple worker nodes
- **Horizontal Scaling**: Designed for seamless horizontal scaling
- **Job Cancellation**: Ability to cancel pending or active jobs

## 🏗️ Architecture

This system follows a distributed architecture with these key components:

1. **Job Producers**: API endpoints that allow clients to enqueue jobs
2. **Redis Queue**: Central storage for job data and metadata
3. **Worker Nodes**: Distributed processors that execute jobs
4. **Monitoring Service**: Tracks queue health and job statuses

For a detailed architecture diagram, see [Architecture Diagram](docs/architecture.txt)

## 🔧 Design Decisions

### Why Redis and Bull?

- **Redis**: Provides fast, in-memory data storage with persistence, pub/sub messaging, and atomic operations - ideal for job queues
- **Bull**: Mature, feature-rich queue implementation for Node.js that uses Redis, with support for priorities, delays, retries, and distributed processing

### Job Processing Approach

- **Typed Jobs**: Each job type has a dedicated processor for clear separation of concerns
- **Progress Reporting**: Workers report progress percentages to enable real-time tracking
- **Graceful Failure Handling**: Failed jobs are retried with exponential backoff before being moved to a failed jobs list

### Monitoring and Scaling

- **Health Metrics**: System collects real-time metrics on queue size, processing rate, and failures
- **Horizontal Scaling**: Workers can scale independently based on queue load
- **Stateless Design**: Workers maintain no local state, enabling easy scaling and failover

## 💻 Implementation Details

### Job Types

The system supports these job types out of the box:

- `data-processing`: General data processing tasks
- `image-processing`: Image manipulation tasks
- `email-sending`: Email notification tasks
- `report-generation`: Report creation and formatting tasks

### Job Priorities

Jobs can be assigned one of these priority levels:

- `low` (5): Background, non-urgent tasks
- `normal` (10): Default priority for most tasks
- `high` (15): Important tasks that should be processed soon
- `critical` (20): Urgent tasks that need immediate processing

### Job Lifecycle

1. **Creation**: Client submits job via API
2. **Queueing**: Job is stored in Redis with metadata
3. **Processing**: Worker picks up job based on priority
4. **Progress**: Worker reports progress as percentage
5. **Completion/Failure**: Final result or error is stored
6. **Cleanup**: Completed jobs are removed (configurable)

## 🚀 API Endpoints

### Job Management

- `POST /jobs/enqueue`: Enqueue a generic job
- `POST /:type/enqueue`: Enqueue a specific job type
- `GET /jobs/:id/status`: Get job status
- `GET /jobs/:id/progress`: Get detailed job progress
- `DELETE /jobs/:id`: Cancel a job

### Monitoring

- `GET /jobs/stats`: Get queue statistics
- `GET /jobs/health`: Get queue health status
- `GET /jobs/workers`: Get worker statistics
- `GET /jobs/failed`: Get failed jobs
- `GET /jobs/pending`: Get pending jobs
- `GET /jobs/active`: Get active jobs
- `GET /jobs/:type/jobs`: Get jobs by type

See the [Example Usage Guide](docs/example-usage.md) for detailed API usage examples and client integration code samples.

## ⚙️ Setup & Configuration

### Prerequisites

- Node.js (v14+)
- Redis server (v5+)

### Installation

```bash
# Install dependencies
npm install

# Configure environment
cp .env.example .env
# Edit .env with your Redis configuration
```

### Environment Variables

- `REDIS_HOST`: Redis server hostname (default: "localhost")
- `REDIS_PORT`: Redis server port (default: 6379)
- `REDIS_PASSWORD`: Redis password (if required)
- `WORKER_COUNT`: Number of worker processes (default: 1)

### Running the System

```bash
# Start the API server and workers
npm run start

# Development mode
npm run start:dev

# Production mode
npm run start:prod
```

### Running Workers Only

```bash
# Start only worker processes
npm run start:worker
```

## 📈 Scaling Considerations

### Horizontal Scaling

The system supports horizontal scaling in several ways:

1. **Multiple Workers**: Start multiple worker processes on different machines
2. **Redis Cluster**: For high-throughput requirements, use Redis Cluster
3. **Load Balancing**: API servers can be load-balanced

### Performance Tuning

- Adjust `removeOnComplete` and `removeOnFail` settings based on monitoring needs
- Configure appropriate retry settings for different job types
- Use delayed jobs for rate limiting or scheduled processing

## 🚀 Deployment

For production deployment, we provide deployment guides for cloud environments:

- [AWS Deployment with Pulumi](docs/cloud-deployment.md) - Deploy to AWS using Infrastructure as Code with Pulumi

The deployment guide includes:

- Containerization with Docker
- Infrastructure setup with Pulumi (JavaScript)
- Auto-scaling configuration for workers
- Monitoring with CloudWatch
- Security best practices

## 📄 License

[MIT License](LICENSE)
