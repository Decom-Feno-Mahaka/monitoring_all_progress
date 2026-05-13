import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import axios from 'axios';

@Injectable()
export class GitHubService {
  private readonly logger = new Logger(GitHubService.name);

  constructor(
    private config: ConfigService,
    private prisma: PrismaService,
  ) {}

  private get headers() {
    const token = this.config.get('GITHUB_TOKEN');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  async syncProjectGitHub(projectId: string) {
    const integration = await this.prisma.gitHubIntegration.findUnique({
      where: { projectId },
    });
    if (!integration) return null;

    try {
      const { owner, repo } = integration;
      const base = `https://api.github.com/repos/${owner}/${repo}`;

      const [repoRes, commitsRes, issuesRes, prsRes] = await Promise.all([
        axios.get(base, { headers: this.headers }),
        axios.get(`${base}/commits?per_page=1`, { headers: this.headers }),
        axios.get(`${base}/issues?state=open&per_page=1`, { headers: this.headers }),
        axios.get(`${base}/pulls?state=open&per_page=1`, { headers: this.headers }),
      ]);

      const commitCount = parseInt(commitsRes.headers['link']?.match(/page=(\d+)>; rel="last"/)?.[1] ?? '1');
      const openIssues = repoRes.data.open_issues_count;
      const openPRs = prsRes.data.length;
      const stars = repoRes.data.stargazers_count;
      const lastPushedAt = new Date(repoRes.data.pushed_at);

      const updated = await this.prisma.gitHubIntegration.update({
        where: { projectId },
        data: { commitCount, openIssues, openPRs, stars, lastPushedAt, lastSyncedAt: new Date() },
      });

      // Update project github_stats
      await this.prisma.project.update({
        where: { id: projectId },
        data: {
          githubStats: { commitCount, openIssues, openPRs, stars, lastPushedAt },
        },
      });

      return updated;
    } catch (err) {
      this.logger.error(`GitHub sync failed for ${projectId}: ${err.message}`);
      return null;
    }
  }

  async linkRepo(projectId: string, owner: string, repo: string, defaultBranch = 'main') {
    const existing = await this.prisma.gitHubIntegration.findUnique({ where: { projectId } });
    if (existing) {
      return this.prisma.gitHubIntegration.update({
        where: { projectId },
        data: { owner, repo, defaultBranch },
      });
    }
    const integration = await this.prisma.gitHubIntegration.create({
      data: { projectId, owner, repo, defaultBranch },
    });
    await this.syncProjectGitHub(projectId);
    return integration;
  }

  async unlinkRepo(projectId: string) {
    await this.prisma.gitHubIntegration.delete({ where: { projectId } });
    return { message: 'GitHub repo unlinked' };
  }

  async getRepoInfo(owner: string, repo: string) {
    try {
      const res = await axios.get(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: this.headers,
      });
      return {
        name: res.data.name,
        description: res.data.description,
        stars: res.data.stargazers_count,
        forks: res.data.forks_count,
        language: res.data.language,
        defaultBranch: res.data.default_branch,
        htmlUrl: res.data.html_url,
      };
    } catch {
      return null;
    }
  }
}
