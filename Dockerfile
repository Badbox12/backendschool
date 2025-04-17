# Base image
FROM oven/bun:latest

# Set working directory
WORKDIR /app

# Copy files
COPY package.json ./
COPY ./src ./src

# Install dependencies
RUN bun install

# Expose the app port
EXPOSE 3000

# Start the application
CMD ["bun", "run", "src/index.ts"]
