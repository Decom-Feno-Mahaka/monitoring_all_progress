import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { ActivityType, EvidenceType } from '@prisma/client';

@Injectable()
export class ActivitiesService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  async create(projectId: string, userId: string, dto: {
    type?: ActivityType;
    title: string;
    description?: string;
    milestoneId?: string;
    progressBefore?: number;
    progressAfter?: number;
    metadata?: any;
  }) {
    const activity = await this.prisma.activity.create({
      data: { ...dto, projectId, userId },
      include: {
        user: { select: { id: true, name: true, avatar: true } },
        milestone: true,
        evidences: true,
      },
    });
    this.eventEmitter.emit('activity.created', { projectId, activity });
    return activity;
  }

  async findAll(projectId: string, query: { page?: number; limit?: number; type?: string }) {
    const { page = 1, limit = 20, type } = query;
    const where: any = { projectId };
    if (type) where.type = type;

    const [data, total] = await Promise.all([
      this.prisma.activity.findMany({
        where,
        include: {
          user: { select: { id: true, name: true, avatar: true } },
          milestone: true,
          evidences: true,
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.activity.count({ where }),
    ]);

    return { data, total, page, limit };
  }

  async addEvidence(activityId: string, evidences: Array<{
    type: EvidenceType;
    title: string;
    url: string;
    description?: string;
    fileSize?: number;
    mimeType?: string;
  }>) {
    const created = await Promise.all(
      evidences.map(ev => this.prisma.evidence.create({ data: { ...ev, activityId } })),
    );
    return created;
  }

  async removeEvidence(evidenceId: string) {
    await this.prisma.evidence.delete({ where: { id: evidenceId } });
    return { message: 'Evidence removed' };
  }

  async remove(id: string) {
    const a = await this.prisma.activity.findUnique({ where: { id } });
    if (!a) throw new NotFoundException('Activity not found');
    await this.prisma.activity.delete({ where: { id } });
    return { message: 'Activity deleted' };
  }
}
