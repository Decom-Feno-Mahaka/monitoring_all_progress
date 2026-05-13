#!/bin/bash

# DFM Project Monitor - Setup Script
echo "🚀 DFM Project Monitor Setup"
echo "================================"

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m'

# Check Docker
if ! docker info > /dev/null 2>&1; then
  echo -e "${RED}❌ Docker is not running. Please start Docker Desktop first.${NC}"
  echo "   Download: https://www.docker.com/products/docker-desktop"
  exit 1
fi

echo -e "${GREEN}✅ Docker is running${NC}"

# Start services
echo ""
echo "📦 Starting PostgreSQL and Redis..."
docker-compose up -d

echo "⏳ Waiting for PostgreSQL to be ready..."
sleep 5

# Backend setup
echo ""
echo "⚙️  Setting up backend..."
cd backend

if ! npx prisma migrate dev --name init 2>&1; then
  echo -e "${RED}❌ Migration failed. Check your .env file.${NC}"
  exit 1
fi

echo -e "${GREEN}✅ Database migrated${NC}"

echo "🌱 Seeding demo data..."
npm run seed

echo -e "${GREEN}✅ Demo data seeded${NC}"

cd ..

echo ""
echo "================================"
echo -e "${GREEN}✅ Setup complete!${NC}"
echo ""
echo "To start the platform:"
echo ""
echo "  Terminal 1 (Backend):"
echo "  $ cd backend && npm run start:dev"
echo ""
echo "  Terminal 2 (Frontend):"
echo "  $ cd frontend && npm run dev"
echo ""
echo "URLs:"
echo "  Public Dashboard: http://localhost:3000"
echo "  Admin Panel:      http://localhost:3000/admin"
echo "  API:              http://localhost:3001/api"
echo ""
echo "Admin login:"
echo "  Email:    admin@dfm.id"
echo "  Password: admin123456"
