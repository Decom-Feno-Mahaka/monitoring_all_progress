import {
  IsString, IsOptional, IsEnum, IsNumber, IsArray, IsUrl, IsDateString, Min, Max,
} from 'class-validator';
import { PartialType } from '@nestjs/mapped-types';
import { ProjectCategory, ProjectStatus, HealthStatus, ProjectVisibility, ProjectPriority } from '@prisma/client';

export class CreateProjectDto {
  @IsString()
  name: string;

  @IsOptional()
  @IsString()
  description?: string;

  @IsOptional()
  @IsEnum(ProjectCategory)
  category?: ProjectCategory;

  @IsOptional()
  @IsEnum(ProjectStatus)
  status?: ProjectStatus;

  @IsOptional()
  @IsEnum(HealthStatus)
  healthStatus?: HealthStatus;

  @IsOptional()
  @IsEnum(ProjectVisibility)
  visibility?: ProjectVisibility;

  @IsOptional()
  @IsEnum(ProjectPriority)
  priority?: ProjectPriority;

  @IsOptional()
  @IsNumber()
  @Min(0) @Max(100)
  overallProgress?: number;

  @IsOptional()
  @IsDateString()
  startDate?: string;

  @IsOptional()
  @IsDateString()
  targetDate?: string;

  @IsOptional()
  @IsDateString()
  actualEndDate?: string;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  tags?: string[];

  @IsOptional()
  @IsUrl()
  githubRepoUrl?: string;

  @IsOptional()
  coverImage?: string;
}

export class UpdateProjectDto extends PartialType(CreateProjectDto) {}

