import { Controller, Get, Query } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';

@Controller('analytics')
export class AnalyticsController {
  constructor(private analyticsService: AnalyticsService) {}

  @Get('dashboard')
  getDashboardStats() {
    return this.analyticsService.getDashboardStats();
  }

  @Get('trends')
  getProjectTrends(@Query('days') days: string) {
    return this.analyticsService.getProjectTrends(parseInt(days) || 30);
  }

  @Get('heatmap')
  getActivityHeatmap(@Query('days') days: string) {
    return this.analyticsService.getActivityHeatmap(parseInt(days) || 90);
  }

  @Get('milestones')
  getMilestoneStats() {
    return this.analyticsService.getMilestoneStats();
  }
}
