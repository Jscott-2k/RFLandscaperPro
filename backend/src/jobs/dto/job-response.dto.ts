export class JobResponseDto {
  id: number;
  title: string;
  description?: string;
  scheduledDate?: Date;
  completed: boolean;
  customer: {
    id: number;
    name: string;
    email: string;
  };
  createdAt: Date;
  updatedAt: Date;
}
