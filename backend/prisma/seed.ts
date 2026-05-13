import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import { Pool } from 'pg';
import * as bcrypt from 'bcryptjs';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL || 'postgresql://dfm_user:dfm_password@localhost:5432/dfm_projects?schema=public',
});
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter } as any);

async function main() {
  console.log('🌱 Seeding database...');

  // Create admin user
  const hashedPw = await bcrypt.hash('admin123456', 12);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@dfm.id' },
    update: {},
    create: {
      email: 'admin@dfm.id',
      name: 'DFM Admin',
      password: hashedPw,
      role: 'SUPER_ADMIN',
    },
  });
  console.log('✅ Admin user created:', admin.email);

  // Create demo projects
  const projects = [
    {
      name: 'AI Document Intelligence Platform',
      slug: 'ai-document-intelligence',
      description: 'Platform AI untuk ekstraksi, klasifikasi, dan analisis dokumen pengadaan pemerintah menggunakan LLM dan computer vision.',
      category: 'AI_ML' as const,
      status: 'IN_PROGRESS' as const,
      healthStatus: 'ON_TRACK' as const,
      overallProgress: 68,
      startDate: new Date('2026-01-15'),
      targetDate: new Date('2026-08-30'),
      tags: ['AI', 'NLP', 'OCR', 'Python', 'FastAPI'],
      visibility: 'PUBLIC' as const,
      createdById: admin.id,
    },
    {
      name: 'LPSE Tender Monitoring Bot',
      slug: 'lpse-tender-monitoring-bot',
      description: 'Bot otomatis untuk monitoring dan scraping data tender dari portal LPSE seluruh Indonesia dengan notifikasi realtime ke Telegram.',
      category: 'SOFTWARE' as const,
      status: 'IN_PROGRESS' as const,
      healthStatus: 'AT_RISK' as const,
      overallProgress: 45,
      startDate: new Date('2026-02-01'),
      targetDate: new Date('2026-06-30'),
      tags: ['Rust', 'Scraping', 'Bot', 'Telegram', 'PostgreSQL'],
      visibility: 'PUBLIC' as const,
      createdById: admin.id,
    },
    {
      name: 'IoT Smart Infrastructure Monitoring',
      slug: 'iot-smart-infrastructure',
      description: 'Sistem IoT untuk pemantauan infrastruktur fisik secara realtime: sensor suhu, kelembaban, dan anomali deteksi berbasis edge computing.',
      category: 'IOT' as const,
      status: 'PLANNING' as const,
      healthStatus: 'ON_TRACK' as const,
      overallProgress: 15,
      startDate: new Date('2026-04-01'),
      targetDate: new Date('2026-12-31'),
      tags: ['IoT', 'MQTT', 'Edge Computing', 'Raspberry Pi', 'InfluxDB'],
      visibility: 'PUBLIC' as const,
      createdById: admin.id,
    },
    {
      name: 'DFM Project Documentation System',
      slug: 'dfm-project-documentation',
      description: 'Platform dokumentasi teknis terpusat untuk semua project DFM dengan versioning, search, dan export capabilities.',
      category: 'DOCUMENTATION' as const,
      status: 'IN_PROGRESS' as const,
      healthStatus: 'ON_TRACK' as const,
      overallProgress: 82,
      startDate: new Date('2026-01-01'),
      targetDate: new Date('2026-05-31'),
      tags: ['Next.js', 'MDX', 'Docusaurus', 'TypeScript'],
      visibility: 'PUBLIC' as const,
      createdById: admin.id,
    },
    {
      name: 'Research: Federated Learning for Privacy-Preserving AI',
      slug: 'research-federated-learning',
      description: 'Penelitian implementasi federated learning untuk model AI yang dapat belajar dari data terdistribusi tanpa melanggar privasi pengguna.',
      category: 'RESEARCH' as const,
      status: 'IN_PROGRESS' as const,
      healthStatus: 'BEHIND' as const,
      overallProgress: 35,
      startDate: new Date('2026-03-01'),
      targetDate: new Date('2026-09-30'),
      tags: ['Research', 'ML', 'Privacy', 'Python', 'PyTorch'],
      visibility: 'PUBLIC' as const,
      createdById: admin.id,
    },
    {
      name: 'Internal DevOps Infrastructure',
      slug: 'internal-devops-infrastructure',
      description: 'Setup CI/CD pipeline, container orchestration dengan Kubernetes, dan monitoring stack (Prometheus + Grafana) untuk semua layanan DFM.',
      category: 'INFRASTRUCTURE' as const,
      status: 'COMPLETED' as const,
      healthStatus: 'COMPLETED' as const,
      overallProgress: 100,
      startDate: new Date('2025-11-01'),
      targetDate: new Date('2026-02-28'),
      actualEndDate: new Date('2026-02-20'),
      tags: ['DevOps', 'Kubernetes', 'Docker', 'CI/CD', 'Terraform'],
      visibility: 'PUBLIC' as const,
      createdById: admin.id,
    },
  ];

  for (const projectData of projects) {
    const project = await prisma.project.upsert({
      where: { slug: projectData.slug },
      update: {},
      create: projectData,
    });

    // Create milestones
    const milestonesData = getMilestones(project.slug, project.id);
    for (const ms of milestonesData) {
      await prisma.milestone.create({ data: ms });
    }

    // Create activities
    const activitiesData = getActivities(project.id, admin.id);
    for (const act of activitiesData) {
      await prisma.activity.create({ data: act });
    }

    // Create progress snapshots
    const snapshots = generateSnapshots(project.id, project.overallProgress);
    for (const snap of snapshots) {
      await prisma.progressSnapshot.create({ data: snap });
    }

    console.log(`✅ Project created: ${project.name}`);
  }

  console.log('🎉 Seeding complete!');
}

function getMilestones(slug: string, projectId: string) {
  const maps: Record<string, any[]> = {
    'ai-document-intelligence': [
      { projectId, title: 'Architecture & Tech Stack Decision', status: 'COMPLETED', order: 0, weight: 10, targetDate: new Date('2026-02-01'), actualDate: new Date('2026-01-28') },
      { projectId, title: 'OCR & Document Parsing Engine', status: 'COMPLETED', order: 1, weight: 20, targetDate: new Date('2026-03-15'), actualDate: new Date('2026-03-10') },
      { projectId, title: 'LLM Classification Module', status: 'IN_PROGRESS', order: 2, weight: 25, targetDate: new Date('2026-05-30') },
      { projectId, title: 'API & Integration Layer', status: 'PENDING', order: 3, weight: 20, targetDate: new Date('2026-06-30') },
      { projectId, title: 'Dashboard & Reporting UI', status: 'PENDING', order: 4, weight: 15, targetDate: new Date('2026-07-31') },
      { projectId, title: 'Production Deployment & Testing', status: 'PENDING', order: 5, weight: 10, targetDate: new Date('2026-08-30') },
    ],
    'lpse-tender-monitoring-bot': [
      { projectId, title: 'LPSE Endpoint Research & Mapping', status: 'COMPLETED', order: 0, weight: 10, targetDate: new Date('2026-02-15'), actualDate: new Date('2026-02-12') },
      { projectId, title: 'Core Scraping Engine (Rust)', status: 'COMPLETED', order: 1, weight: 25, targetDate: new Date('2026-03-20'), actualDate: new Date('2026-03-25') },
      { projectId, title: 'AI Relevance Detection Integration', status: 'IN_PROGRESS', order: 2, weight: 25, targetDate: new Date('2026-05-15') },
      { projectId, title: 'Telegram Bot Integration', status: 'PENDING', order: 3, weight: 20, targetDate: new Date('2026-06-01') },
      { projectId, title: 'Multi-agensi Support & Deployment', status: 'PENDING', order: 4, weight: 20, targetDate: new Date('2026-06-30') },
    ],
    'iot-smart-infrastructure': [
      { projectId, title: 'Hardware Specification & Procurement', status: 'IN_PROGRESS', order: 0, weight: 15, targetDate: new Date('2026-05-15') },
      { projectId, title: 'Sensor Network Architecture', status: 'PENDING', order: 1, weight: 20, targetDate: new Date('2026-06-30') },
      { projectId, title: 'Edge Computing Setup', status: 'PENDING', order: 2, weight: 20, targetDate: new Date('2026-08-31') },
      { projectId, title: 'Data Pipeline & Storage', status: 'PENDING', order: 3, weight: 25, targetDate: new Date('2026-10-31') },
      { projectId, title: 'Monitoring Dashboard', status: 'PENDING', order: 4, weight: 20, targetDate: new Date('2026-12-31') },
    ],
    'dfm-project-documentation': [
      { projectId, title: 'Information Architecture Design', status: 'COMPLETED', order: 0, weight: 10, targetDate: new Date('2026-01-20'), actualDate: new Date('2026-01-18') },
      { projectId, title: 'Core Platform Setup (Docusaurus)', status: 'COMPLETED', order: 1, weight: 20, targetDate: new Date('2026-02-15'), actualDate: new Date('2026-02-10') },
      { projectId, title: 'Content Migration & Writing', status: 'COMPLETED', order: 2, weight: 30, targetDate: new Date('2026-04-30'), actualDate: new Date('2026-04-25') },
      { projectId, title: 'Search & Navigation Enhancement', status: 'IN_PROGRESS', order: 3, weight: 20, targetDate: new Date('2026-05-20') },
      { projectId, title: 'Final Review & Launch', status: 'PENDING', order: 4, weight: 20, targetDate: new Date('2026-05-31') },
    ],
    'research-federated-learning': [
      { projectId, title: 'Literature Review & State of the Art', status: 'COMPLETED', order: 0, weight: 15, targetDate: new Date('2026-03-31'), actualDate: new Date('2026-04-05') },
      { projectId, title: 'Baseline Model Implementation', status: 'IN_PROGRESS', order: 1, weight: 25, targetDate: new Date('2026-05-31') },
      { projectId, title: 'Federated Training Experiments', status: 'PENDING', order: 2, weight: 30, targetDate: new Date('2026-07-31') },
      { projectId, title: 'Analysis & Paper Writing', status: 'PENDING', order: 3, weight: 20, targetDate: new Date('2026-09-15') },
      { projectId, title: 'Submission & Publication', status: 'PENDING', order: 4, weight: 10, targetDate: new Date('2026-09-30') },
    ],
    'internal-devops-infrastructure': [
      { projectId, title: 'Infrastructure Planning & Design', status: 'COMPLETED', order: 0, weight: 10, targetDate: new Date('2025-11-30'), actualDate: new Date('2025-11-25') },
      { projectId, title: 'Kubernetes Cluster Setup', status: 'COMPLETED', order: 1, weight: 25, targetDate: new Date('2025-12-31'), actualDate: new Date('2025-12-28') },
      { projectId, title: 'CI/CD Pipeline Configuration', status: 'COMPLETED', order: 2, weight: 25, targetDate: new Date('2026-01-31'), actualDate: new Date('2026-01-25') },
      { projectId, title: 'Monitoring Stack (Prometheus + Grafana)', status: 'COMPLETED', order: 3, weight: 20, targetDate: new Date('2026-02-20'), actualDate: new Date('2026-02-18') },
      { projectId, title: 'Documentation & Team Onboarding', status: 'COMPLETED', order: 4, weight: 20, targetDate: new Date('2026-02-28'), actualDate: new Date('2026-02-20') },
    ],
  };
  return maps[slug] || [];
}

function getActivities(projectId: string, userId: string) {
  return [
    {
      projectId, userId,
      type: 'PROGRESS_UPDATE' as const,
      title: 'Progress update Q1 2026',
      description: 'Tim telah berhasil menyelesaikan fase pertama sesuai jadwal. Semua module core sudah berjalan dan siap untuk integrasi.',
      progressBefore: 40,
      progressAfter: 55,
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
    },
    {
      projectId, userId,
      type: 'MILESTONE_REACHED' as const,
      title: 'Core module selesai',
      description: 'Milestone pertama tercapai: core module sudah production-ready dan telah melewati code review.',
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
    },
    {
      projectId, userId,
      type: 'NOTE' as const,
      title: 'Technical discussion meeting',
      description: 'Diskusi teknis dengan tim untuk membahas optimasi performa dan arsitektur sistem.',
      createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000),
    },
  ];
}

function generateSnapshots(projectId: string, currentProgress: number) {
  const snapshots: { projectId: string; progress: number; takenAt: Date }[] = [];
  const now = Date.now();
  const startProgress = Math.max(0, currentProgress - 40);

  for (let i = 30; i >= 0; i--) {
    const date = new Date(now - i * 24 * 60 * 60 * 1000);
    const progress = Math.round(startProgress + ((currentProgress - startProgress) * (30 - i)) / 30);
    snapshots.push({ projectId, progress, takenAt: date });
  }
  return snapshots;
}

main()
  .catch(e => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
