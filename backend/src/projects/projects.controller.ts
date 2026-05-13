import {
  Controller, Get, Post, Patch, Delete, Param, Body, Query, UseGuards, Request,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { CreateProjectDto, UpdateProjectDto } from './dto/project.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('projects')
export class ProjectsController {
  constructor(private projectsService: ProjectsService) {}

  // Public routes
  @Get('public')
  findPublic(@Query() query: any) {
    return this.projectsService.findPublic(query);
  }

  @Get('public/:slug')
  findPublicOne(@Param('slug') slug: string) {
    return this.projectsService.findOne(slug);
  }

  // Admin routes
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Body() dto: CreateProjectDto, @Request() req) {
    return this.projectsService.create(dto, req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get()
  findAll(@Query() query: any) {
    return this.projectsService.findAll(query);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.projectsService.findOne(id);
  }

  @UseGuards(JwtAuthGuard)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateProjectDto, @Request() req) {
    return this.projectsService.update(id, dto, req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.projectsService.remove(id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id/progress-history')
  getProgressHistory(@Param('id') id: string) {
    return this.projectsService.getProgressHistory(id);
  }
}
