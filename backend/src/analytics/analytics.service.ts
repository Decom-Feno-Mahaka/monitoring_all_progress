import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class AnalyticsService {
  constructor(private prisma: PrismaService) {}

  async getDashboardStats() {
    const [
      totalProjects,
      byStatus,
      byHealth,
      byCategory,
      recentActivities,
      upcomingMilestones,
      completedThisMonth,
    ] = await Promise.all([
      this.prisma.project.count(),
      this.prisma.project.groupBy({ by: ['status'], _count: true }),
      this.prisma.project.groupBy({ by: ['healthStatus'], _count: true }),
      this.prisma.project.groupBy({ by: ['category'], _count: true }),
      this.prisma.activity.findMany({
        orderBy: { createdAt: 'desc' },
        take: 10,
        include: {
          project: { select: { id: true, name: true, slug: true, category: true } },
          user: { select: { id: true, name: true, avatar: true } },
        },
      }),
      this.prisma.milestone.findMany({
        where: {
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          targetDate: { gte: new Date(), lte: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) },
        },
        include: { project: { select: { id: true, name: true, slug: true } } },
        orderBy: { targetDate: 'asc' },
        take: 10,
      }),
      this.prisma.project.count({
        where: {
          status: 'COMPLETED',
          actualEndDate: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
          },
        },
      }),
    ]);

    const avgProgress = await this.prisma.project.aggregate({
      _avg: { overallProgress: true },
      where: { status: { not: 'COMPLETED' } },
    });

    return {
      totalProjects,
      avgProgress: Math.round(avgProgress._avg.overallProgress ?? 0),
      completedThisMonth,
      byStatus: Object.fromEntries(byStatus.map(s => [s.status, s._count])),
      byHealth: Object.fromEntries(byHealth.map(h => [h.healthStatus, h._count])),
      byCategory: Object.fromEntries(byCategory.map(c => [c.category, c._count])),
      recentActivities,
      upcomingMilestones,
    };
  }

  async getProjectTrends(days = 30) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const snapshots = await this.prisma.progressSnapshot.findMany({
      where: { takenAt: { gte: since } },
      include: { project: { select: { id: true, name: true, category: true } } },
      orderBy: { takenAt: 'asc' },
    });
    return snapshots;
  }

  async getActivityHeatmap(days = 90) {
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
    const activities = await this.prisma.activity.findMany({
      where: { createdAt: { gte: since } },
      select: { createdAt: true },
    });

    const heatmap: Record<string, number> = {};
    activities.forEach(a => {
      const key = a.createdAt.toISOString().split('T')[0];
      heatmap[key] = (heatmap[key] || 0) + 1;
    });
    return heatmap;
  }

  async getMilestoneStats() {
    const stats = await this.prisma.milestone.groupBy({
      by: ['status'],
      _count: true,
    });
    return Object.fromEntries(stats.map(s => [s.status, s._count]));
  }
}
