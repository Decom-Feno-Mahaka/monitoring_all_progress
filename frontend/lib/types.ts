// ===== ENUMS =====
export type Role = 'SUPER_ADMIN' | 'ADMIN' | 'VIEWER';
export type ProjectStatus = 'PLANNING' | 'IN_PROGRESS' | 'ON_HOLD' | 'COMPLETED' | 'CANCELLED' | 'ARCHIVED';
export type HealthStatus = 'ON_TRACK' | 'AT_RISK' | 'BEHIND' | 'COMPLETED' | 'ON_HOLD';
export type ProjectCategory = 'SOFTWARE' | 'AI_ML' | 'IOT' | 'RESEARCH' | 'DOCUMENTATION' | 'DEVELOPMENT' | 'INFRASTRUCTURE' | 'DESIGN' | 'OTHER';
export type ProjectVisibility = 'PUBLIC' | 'INTERNAL';
export type MilestoneStatus = 'PENDING' | 'IN_PROGRESS' | 'COMPLETED' | 'DELAYED' | 'CANCELLED';
export type ActivityType = 'UPDATE' | 'MILESTONE_REACHED' | 'EVIDENCE_ADDED' | 'STATUS_CHANGED' | 'PROGRESS_UPDATE' | 'NOTE' | 'MEETING' | 'DEPLOYMENT' | 'REVIEW';
export type EvidenceType = 'FILE' | 'LINK' | 'IMAGE' | 'DOCUMENT' | 'VIDEO';

// ===== MODELS =====
export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatar?: string;
  isActive: boolean;
  lastLoginAt?: string;
  createdAt: string;
}

export interface GitHubIntegration {
  id: string;
  projectId: string;
  owner: string;
  repo: string;
  defaultBranch: string;
  commitCount: number;
  openIssues: number;
  openPRs: number;
  stars: number;
  lastPushedAt?: string;
  lastSyncedAt?: string;
}

export interface Milestone {
  id: string;
  projectId: string;
  title: string;
  description?: string;
  status: MilestoneStatus;
  targetDate?: string;
  actualDate?: string;
  order: number;
  weight: number;
  createdAt: string;
  updatedAt: string;
}

export interface Evidence {
  id: string;
  activityId: string;
  type: EvidenceType;
  title: string;
  description?: string;
  url: string;
  fileSize?: number;
  mimeType?: string;
  createdAt: string;
}

export interface Activity {
  id: string;
  projectId: string;
  milestoneId?: string;
  userId: string;
  type: ActivityType;
  title: string;
  description?: string;
  progressBefore?: number;
  progressAfter?: number;
  metadata?: Record<string, any>;
  createdAt: string;
  user?: Pick<User, 'id' | 'name' | 'avatar'>;
  milestone?: Milestone;
  evidences?: Evidence[];
}

export interface ProgressSnapshot {
  id: string;
  projectId: string;
  progress: number;
  note?: string;
  takenAt: string;
}

export interface Project {
  id: string;
  name: string;
  slug: string;
  description?: string;
  category: ProjectCategory;
  status: ProjectStatus;
  healthStatus: HealthStatus;
  visibility: ProjectVisibility;
  overallProgress: number;
  startDate?: string;
  targetDate?: string;
  actualEndDate?: string;
  tags: string[];
  coverImage?: string;
  githubRepoUrl?: string;
  githubStats?: Record<string, any>;
  metadata?: Record<string, any>;
  createdById: string;
  updatedById?: string;
  createdAt: string;
  updatedAt: string;
  createdBy?: Pick<User, 'id' | 'name' | 'email' | 'avatar'>;
  updatedBy?: Pick<User, 'id' | 'name' | 'email'>;
  milestones?: Milestone[];
  activities?: Activity[];
  progressSnapshots?: ProgressSnapshot[];
  githubIntegration?: GitHubIntegration;
  _count?: { activities: number };
}

// ===== API RESPONSE TYPES =====
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface DashboardStats {
  totalProjects: number;
  avgProgress: number;
  completedThisMonth: number;
  byStatus: Record<ProjectStatus, number>;
  byHealth: Record<HealthStatus, number>;
  byCategory: Record<ProjectCategory, number>;
  recentActivities: Activity[];
  upcomingMilestones: (Milestone & { project: Pick<Project, 'id' | 'name' | 'slug'> })[];
}

// ===== UI HELPERS =====
export const HEALTH_CONFIG: Record<HealthStatus, { label: string; color: string; bgClass: string; dotColor: string }> = {
  ON_TRACK: { label: 'On Track', color: '#00C951', bgClass: 'health-bg-on-track', dotColor: 'bg-emerald-500' },
  AT_RISK: { label: 'At Risk', color: '#f59e0b', bgClass: 'health-bg-at-risk', dotColor: 'bg-amber-500' },
  BEHIND: { label: 'Behind', color: '#ef4444', bgClass: 'health-bg-behind', dotColor: 'bg-red-500' },
  COMPLETED: { label: 'Completed', color: '#00B9D9', bgClass: 'health-bg-completed', dotColor: 'bg-[#00B9D9]' },
  ON_HOLD: { label: 'On Hold', color: '#94a3b8', bgClass: 'health-bg-on-hold', dotColor: 'bg-slate-400' },
};

export const STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string }> = {
  PLANNING: { label: 'Planning', color: '#00B9D9' },
  IN_PROGRESS: { label: 'In Progress', color: '#3b82f6' },
  ON_HOLD: { label: 'On Hold', color: '#f59e0b' },
  COMPLETED: { label: 'Completed', color: '#00C951' },
  CANCELLED: { label: 'Cancelled', color: '#ef4444' },
  ARCHIVED: { label: 'Archived', color: '#94a3b8' },
};

export const CATEGORY_CONFIG: Record<ProjectCategory, { label: string; icon: string; cssClass: string }> = {
  SOFTWARE: { label: 'Software', icon: '💻', cssClass: 'cat-SOFTWARE' },
  AI_ML: { label: 'AI/ML', icon: '🤖', cssClass: 'cat-AI_ML' },
  IOT: { label: 'IoT', icon: '📡', cssClass: 'cat-IOT' },
  RESEARCH: { label: 'Research', icon: '🔬', cssClass: 'cat-RESEARCH' },
  DOCUMENTATION: { label: 'Documentation', icon: '📚', cssClass: 'cat-DOCUMENTATION' },
  DEVELOPMENT: { label: 'Development', icon: '⚙️', cssClass: 'cat-DEVELOPMENT' },
  INFRASTRUCTURE: { label: 'Infrastructure', icon: '🏗️', cssClass: 'cat-INFRASTRUCTURE' },
  DESIGN: { label: 'Design', icon: '🎨', cssClass: 'cat-DESIGN' },
  OTHER: { label: 'Other', icon: '📋', cssClass: 'cat-OTHER' },
};

export const ACTIVITY_CONFIG: Record<ActivityType, { label: string; icon: string; color: string }> = {
  UPDATE: { label: 'Update', icon: '📝', color: '#3b82f6' },
  MILESTONE_REACHED: { label: 'Milestone Reached', icon: '🏆', color: '#00C951' },
  EVIDENCE_ADDED: { label: 'Evidence Added', icon: '📎', color: '#00B9D9' },
  STATUS_CHANGED: { label: 'Status Changed', icon: '🔄', color: '#f59e0b' },
  PROGRESS_UPDATE: { label: 'Progress Update', icon: '📈', color: '#00C951' },
  NOTE: { label: 'Note', icon: '💬', color: '#94a3b8' },
  MEETING: { label: 'Meeting', icon: '🤝', color: '#8b5cf6' },
  DEPLOYMENT: { label: 'Deployment', icon: '🚀', color: '#06b6d4' },
  REVIEW: { label: 'Review', icon: '👁️', color: '#f97316' },
};
