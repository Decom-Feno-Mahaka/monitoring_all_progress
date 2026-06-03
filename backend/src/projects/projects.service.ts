import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import slugify from 'slugify';

const PROJECT_INCLUDE = {
  createdBy: { select: { id: true, name: true, email: true, avatar: true } },
  updatedBy: { select: { id: true, name: true, email: true } },
  milestones: { orderBy: { order: 'asc' as const } },
  _count: { select: { activities: true } },
  githubIntegration: true,
};

@Injectable()
export class ProjectsService {
  constructor(
    private prisma: PrismaService,
    private eventEmitter: EventEmitter2,
  ) {}

  private generateSlug(name: string): string {
    return slugify(name, { lower: true, strict: true, trim: true });
  }

  private parseDate(value?: string): Date | undefined {
    if (!value) return undefined;
    // Accepts both 'YYYY-MM-DD' and full ISO strings
    const d = new Date(value);
    return isNaN(d.getTime()) ? undefined : d;
  }

  private normalizeDates<T extends { startDate?: string; targetDate?: string; actualEndDate?: string }>(dto: T) {
    const { startDate, targetDate, actualEndDate, ...rest } = dto as any;
    return {
      ...rest,
      ...(startDate !== undefined && { startDate: this.parseDate(startDate) }),
      ...(targetDate !== undefined && { targetDate: this.parseDate(targetDate) }),
      ...(actualEndDate !== undefined && { actualEndDate: this.parseDate(actualEndDate) }),
    };
  }

  async create(dto: CreateProjectDto, userId: string) {
    const baseSlug = this.generateSlug(dto.name);
    let slug = baseSlug;
    let count = 0;
    while (await this.prisma.project.findUnique({ where: { slug } })) {
      slug = `${baseSlug}-${++count}`;
    }

    const data = this.normalizeDates(dto);
    const project = await this.prisma.project.create({
      data: { ...data, slug, createdById: userId },
      include: PROJECT_INCLUDE,
    });

    this.eventEmitter.emit('project.created', project);
    return project;
  }

  async findAll(query: {
    category?: string;
    status?: string;
    healthStatus?: string;
    visibility?: string;
    search?: string;
    page?: number;
    limit?: number;
  }) {
    const { category, status, healthStatus, visibility, search } = query;
    const page = parseInt(String(query.page || 1), 10);
    const limit = parseInt(String(query.limit || 20), 10);
    const where: any = {};

    if (category) where.category = category;
    if (status) where.status = status;
    if (healthStatus) where.healthStatus = healthStatus;
    if (visibility) where.visibility = visibility;
    if (search) {
      where.OR = [
        { name: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
        { tags: { hasSome: [search] } },
      ];
    }

    const [data, total] = await Promise.all([
      this.prisma.project.findMany({
        where,
        include: PROJECT_INCLUDE,
        orderBy: { updatedAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prisma.project.count({ where }),
    ]);

    return { data, total, page, limit, totalPages: Math.ceil(total / limit) };
  }

  async findPublic(query: any) {
    return this.findAll({ ...query, visibility: 'PUBLIC' });
  }

  async findOne(idOrSlug: string) {
    const project = await this.prisma.project.findFirst({
      where: { OR: [{ id: idOrSlug }, { slug: idOrSlug }] },
      include: {
        ...PROJECT_INCLUDE,
        activities: {
          orderBy: { createdAt: 'desc' },
          take: 10,
          include: { user: { select: { id: true, name: true, avatar: true } }, evidences: true },
        },
        progressSnapshots: { orderBy: { takenAt: 'desc' }, take: 30 },
      },
    });
    if (!project) throw new NotFoundException('Project not found');
    return project;
  }

  async update(id: string, dto: UpdateProjectDto, userId: string) {
    const existing = await this.prisma.project.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Project not found');

    const data = this.normalizeDates(dto);
    const project = await this.prisma.project.update({
      where: { id },
      data: { ...data, updatedById: userId },
      include: PROJECT_INCLUDE,
    });

    // Snapshot progress if changed
    if (dto.overallProgress !== undefined && dto.overallProgress !== existing.overallProgress) {
      await this.prisma.progressSnapshot.create({
        data: { projectId: id, progress: dto.overallProgress },
      });
    }

    this.eventEmitter.emit('project.updated', project);
    return project;
  }

  async remove(id: string) {
    const project = await this.prisma.project.findUnique({ where: { id } });
    if (!project) throw new NotFoundException('Project not found');
    await this.prisma.project.delete({ where: { id } });
    this.eventEmitter.emit('project.deleted', { id });
    return { message: 'Project deleted' };
  }

  async getProgressHistory(projectId: string) {
    return this.prisma.progressSnapshot.findMany({
      where: { projectId },
      orderBy: { takenAt: 'asc' },
    });
  }
}
