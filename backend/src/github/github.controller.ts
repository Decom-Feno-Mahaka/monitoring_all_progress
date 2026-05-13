import { Controller, Post, Delete, Get, Param, Body, UseGuards } from '@nestjs/common';
import { GitHubService } from './github.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('projects/:projectId/github')
@UseGuards(JwtAuthGuard)
export class GitHubController {
  constructor(private githubService: GitHubService) {}

  @Post('link')
  linkRepo(
    @Param('projectId') projectId: string,
    @Body() body: { owner: string; repo: string; defaultBranch?: string },
  ) {
    return this.githubService.linkRepo(projectId, body.owner, body.repo, body.defaultBranch);
  }

  @Delete('unlink')
  unlinkRepo(@Param('projectId') projectId: string) {
    return this.githubService.unlinkRepo(projectId);
  }

  @Post('sync')
  sync(@Param('projectId') projectId: string) {
    return this.githubService.syncProjectGitHub(projectId);
  }

  @Get('info')
  getInfo(@Param('projectId') _: string, @Body() body: { owner: string; repo: string }) {
    return this.githubService.getRepoInfo(body.owner, body.repo);
  }
}
