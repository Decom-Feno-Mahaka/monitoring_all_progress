import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { IsString, IsOptional, IsEnum, IsNumber, IsDateString } from 'class-validator';
import { MilestoneStatus } from '@prisma/client';
import { PartialType } from '@nestjs/mapped-types';

export class CreateMilestoneDto {
  @IsString() title: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsEnum(MilestoneStatus) status?: MilestoneStatus;
  @IsOptional() @IsDateString() targetDate?: string;
  @IsOptional() @IsNumber() order?: number;
  @IsOptional() @IsNumber() weight?: number;
}

export class UpdateMilestoneDto extends PartialType(CreateMilestoneDto) {
  @IsOptional() @IsDateString() actualDate?: string;
}

@Injectable()
export class MilestonesService {
  constructor(private prisma: PrismaService) {}

  async create(projectId: string, dto: CreateMilestoneDto) {
    const count = await this.prisma.milestone.count({ where: { projectId } });
    const data: any = { ...dto, projectId, order: dto.order ?? count };
    
    if (data.targetDate) {
      data.targetDate = new Date(data.targetDate).toISOString();
    }
    
    return this.prisma.milestone.create({
      data,
    });
  }

  async findAll(projectId: string) {
    return this.prisma.milestone.findMany({
      where: { projectId },
      orderBy: { order: 'asc' },
    });
  }

  async findOne(id: string) {
    const m = await this.prisma.milestone.findUnique({ where: { id } });
    if (!m) throw new NotFoundException('Milestone not found');
    return m;
  }

  async update(id: string, dto: UpdateMilestoneDto) {
    const data: any = { ...dto };
    if (data.targetDate) {
      data.targetDate = new Date(data.targetDate).toISOString();
    }
    if (data.actualDate) {
      data.actualDate = new Date(data.actualDate).toISOString();
    }
    return this.prisma.milestone.update({ where: { id }, data });
  }

  async remove(id: string) {
    await this.prisma.milestone.delete({ where: { id } });
    return { message: 'Milestone deleted' };
  }

  async reorder(projectId: string, ids: string[]) {
    const updates = ids.map((id, index) =>
      this.prisma.milestone.update({ where: { id }, data: { order: index } }),
    );
    await Promise.all(updates);
    return this.findAll(projectId);
  }
}
