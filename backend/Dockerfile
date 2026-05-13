# ===== Stage 1: Builder =====
FROM node:20-alpine AS builder

WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY prisma ./prisma
RUN npx prisma generate

COPY . .
RUN npm run build

# ===== Stage 2: Runner =====
FROM node:20-alpine AS runner

WORKDIR /app

# Install only production deps
COPY package*.json ./
RUN npm ci --only=production

# Copy built artifacts
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# Create uploads directory
RUN mkdir -p uploads

EXPOSE 3001

# Run migrations then start app
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main"]
