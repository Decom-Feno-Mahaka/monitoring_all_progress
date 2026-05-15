import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  const project = await prisma.project.findFirst();
  if (!project) {
    console.log("No projects found");
    return;
  }
  
  try {
    const ms = await prisma.milestone.create({
      data: {
        projectId: project.id,
        title: "Test Milestone",
        targetDate: "2024-05-16",
        weight: 10,
        order: 0
      }
    });
    console.log("Success:", ms);
  } catch (e) {
    console.error("Error creating milestone:", e);
  }
}

main().finally(() => prisma.$disconnect());
