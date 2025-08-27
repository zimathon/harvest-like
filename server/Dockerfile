# Use an official Node.js runtime as a parent image (choose a suitable version)
FROM node:20-alpine AS base

WORKDIR /app

# Install dependencies including dev dependencies for building
COPY package*.json ./
RUN npm install

# Copy application source code
COPY . .

# Build TypeScript
RUN npm run build

# --- Production Stage ---
FROM node:20-alpine AS production

WORKDIR /app

# Copy built artifacts and production dependencies
COPY --from=base /app/package*.json ./
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/dist ./dist

# Expose the port the app runs on
EXPOSE 5000

# Define the command to run the app
CMD ["node", "dist/index.js"]