import {
  Controller, Get, Post, Delete, Param, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { ActivitiesService } from './activities.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('projects/:projectId/activities')
export class ActivitiesController {
  constructor(private activitiesService: ActivitiesService) {}

  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Param('projectId') projectId: string, @Body() dto: any, @Request() req) {
    return this.activitiesService.create(projectId, req.user.sub, dto);
  }

  @Get()
  findAll(@Param('projectId') projectId: string, @Query() query: any) {
    return this.activitiesService.findAll(projectId, query);
  }

  @UseGuards(JwtAuthGuard)
  @Post(':activityId/evidences')
  addEvidence(@Param('activityId') activityId: string, @Body() body: { evidences: any[] }) {
    return this.activitiesService.addEvidence(activityId, body.evidences);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('evidences/:evidenceId')
  removeEvidence(@Param('evidenceId') evidenceId: string) {
    return this.activitiesService.removeEvidence(evidenceId);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.activitiesService.remove(id);
  }
}
