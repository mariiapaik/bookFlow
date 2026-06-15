import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Service } from './service.entity';
import { CreateServiceDto, UpdateServiceDto } from './catalog.dto';

@Injectable()
export class CatalogService {
  constructor(
    @InjectRepository(Service)
    private readonly repo: Repository<Service>,
  ) {}

  findAll(onlyActive = false) {
    return this.repo.find({
      where: onlyActive ? { active: true } : {},
      order: { name: 'ASC' },
    });
  }

  async findOne(id: string) {
    const service = await this.repo.findOne({ where: { id } });
    if (!service) throw new NotFoundException('Service not found');
    return service;
  }

  create(dto: CreateServiceDto) {
    return this.repo.save(this.repo.create(dto));
  }

  async update(id: string, dto: UpdateServiceDto) {
    const service = await this.findOne(id);
    Object.assign(service, dto);
    return this.repo.save(service);
  }

  async remove(id: string) {
    const service = await this.findOne(id);
    // Soft-disable instead of deleting to preserve booking history integrity.
    service.active = false;
    await this.repo.save(service);
    return { id, deactivated: true };
  }
}
