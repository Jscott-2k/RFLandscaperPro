import { Job } from './entities/job.entity';
import { JobResponseDto } from './dto/job-response.dto';

export function toJobResponseDto(job: Job): JobResponseDto {
  return {
    id: job.id,
    title: job.title,
    description: job.description,
    scheduledDate: job.scheduledDate,
    completed: job.completed,
    estimatedHours: job.estimatedHours,
    actualHours: job.actualHours,
    notes: job.notes,
    customer: {
      id: job.customer.id,
      name: job.customer.name,
      email: job.customer.email,
    },
    assignments: job.assignments?.map((assignment) => ({
      id: assignment.id,
      user: { id: assignment.user.id, username: assignment.user.username },
      equipment: {
        id: assignment.equipment.id,
        name: assignment.equipment.name,
      },
      startTime: assignment.startTime,
      endTime: assignment.endTime,
      notes: assignment.notes,
    })),
    createdAt: job.createdAt,
    updatedAt: job.updatedAt,
  };
}
