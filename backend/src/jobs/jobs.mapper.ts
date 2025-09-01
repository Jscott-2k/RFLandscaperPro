import { type JobResponseDto } from './dto/job-response.dto';
import { type Job } from './entities/job.entity';

export function toJobResponseDto(job: Job): JobResponseDto {
  return {
    actualHours: job.actualHours,
    assignments: job.assignments?.map((assignment) => ({
      endTime: assignment.endTime,
      equipment: {
        id: assignment.equipment.id,
        name: assignment.equipment.name,
      },
      id: assignment.id,
      notes: assignment.notes,
      startTime: assignment.startTime,
      user: { id: assignment.user.id, username: assignment.user.username },
    })),
    completed: job.completed,
    createdAt: job.createdAt,
    customer: {
      email: job.customer.email,
      id: job.customer.id,
      name: job.customer.name,
    },
    description: job.description,
    estimatedHours: job.estimatedHours,
    id: job.id,
    notes: job.notes,
    scheduledDate: job.scheduledDate,
    title: job.title,
    updatedAt: job.updatedAt,
  };
}
