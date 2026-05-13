import {
  Controller, Get, Post, Patch, Delete, Param, Body, UseGuards,
} from '@nestjs/common';
import { MilestonesService, CreateMilestoneDto, UpdateMilestoneDto } from './milestones.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('projects/:projectId/milestones')
@UseGuards(JwtAuthGuard)
export class MilestonesController {
  constructor(private milestonesService: MilestonesService) {}

  @Post()
  create(@Param('projectId') projectId: string, @Body() dto: CreateMilestoneDto) {
    return this.milestonesService.create(projectId, dto);
  }

  @Get()
  findAll(@Param('projectId') projectId: string) {
    return this.milestonesService.findAll(projectId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.milestonesService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateMilestoneDto) {
    return this.milestonesService.update(id, dto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.milestonesService.remove(id);
  }

  @Post('reorder')
  reorder(@Param('projectId') projectId: string, @Body() body: { ids: string[] }) {
    return this.milestonesService.reorder(projectId, body.ids);
  }
}
