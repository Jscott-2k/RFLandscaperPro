import {
  Injectable,
  NotFoundException,
  InternalServerErrorException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Vehicle } from './entities/vehicle.entity';
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleResponseDto } from './dto/vehicle-response.dto';
import { Equipment } from '../equipment/entities/equipment.entity';

@Injectable()
export class VehicleService {
  constructor(
    @InjectRepository(Vehicle)
    private readonly vehicleRepository: Repository<Vehicle>,
  ) {}

  async create(
    createVehicleDto: CreateVehicleDto,
  ): Promise<VehicleResponseDto> {
    const { equipmentIds, ...rest } = createVehicleDto;
    const vehicle = this.vehicleRepository.create({
      ...rest,
      equipment: equipmentIds?.map((id) => ({ id } as Equipment)) || [],
    });
    const saved = await this.vehicleRepository.save(vehicle);
    const vehicleWithRelations = await this.vehicleRepository.findOneOrFail({
      where: { id: saved.id },
      relations: ['equipment'],
    });
    return this.toVehicleResponseDto(vehicleWithRelations);
  }

  async findAll(): Promise<VehicleResponseDto[]> {
    const vehicles = await this.vehicleRepository.find({
      relations: ['equipment'],
    });
    return vehicles.map((vehicle) => this.toVehicleResponseDto(vehicle));
  }

  async findOne(id: number): Promise<VehicleResponseDto> {
    try {
      const vehicle = await this.vehicleRepository.findOne({
        where: { id },
        relations: ['equipment'],
      });
      if (!vehicle) {
        throw new NotFoundException(`Vehicle with ID ${id} not found.`);
      }
      return this.toVehicleResponseDto(vehicle);
    } catch {
      throw new InternalServerErrorException('Failed to retrieve vehicle');
    }
  }

  async update(
    id: number,
    updateVehicleDto: UpdateVehicleDto,
  ): Promise<VehicleResponseDto> {
    const vehicle = await this.vehicleRepository.findOne({
      where: { id },
      relations: ['equipment'],
    });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found.`);
    }
    const { equipmentIds, ...rest } = updateVehicleDto;
    Object.assign(vehicle, rest);
    if (equipmentIds) {
      vehicle.equipment = equipmentIds.map(
        (eid) => ({ id: eid } as Equipment),
      );
    }
    const updated = await this.vehicleRepository.save(vehicle);
    return this.toVehicleResponseDto(updated);
  }

  async remove(id: number): Promise<void> {
    const vehicle = await this.vehicleRepository.findOne({ where: { id } });
    if (!vehicle) {
      throw new NotFoundException(`Vehicle with ID ${id} not found.`);
    }
    await this.vehicleRepository.remove(vehicle);
  }

  private toVehicleResponseDto(vehicle: Vehicle): VehicleResponseDto {
    return {
      id: vehicle.id,
      identifier: vehicle.identifier,
      capacity: vehicle.capacity,
      status: vehicle.status,
      currentLocation: vehicle.currentLocation,
      equipment:
        vehicle.equipment?.map((e) => ({ id: e.id, name: e.name })) || [],
      createdAt: vehicle.createdAt,
      updatedAt: vehicle.updatedAt,
    };
  }
}
