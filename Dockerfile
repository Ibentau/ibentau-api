# Stage 1: Build
FROM node:lts-alpine AS build

# Set the working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package.json and pnpm-lock.yaml (if available) to the working directory
COPY package.json pnpm-lock.yaml* ./

# Install dependencies using pnpm
RUN pnpm install --frozen-lockfile

# Copy the rest of the application code
COPY . .

# Build the TypeScript code
RUN pnpm run build

# Stage 2: Production
FROM node:lts-alpine AS production

# Set the working directory
WORKDIR /app

# Install pnpm globally
RUN npm install -g pnpm

# Copy package.json and pnpm-lock.yaml (if available) to the working directory
COPY package.json pnpm-lock.yaml* ./

# Install production dependencies using pnpm
RUN pnpm install --frozen-lockfile --prod

# Copy the build output from the previous stage
COPY --from=build /app/dist /app/dist

# Expose the port the application will run on
EXPOSE 3000

# Start the application
CMD ["pnpm", "run", "start"]
