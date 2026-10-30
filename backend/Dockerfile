FROM node:20-alpine

# Set working directory
WORKDIR /usr/src/app

# Add tzdata in case timezone is needed
RUN apk add --no-cache tzdata

# Copy package files
COPY package*.json ./

# Install dependencies (including sequelize-cli for database migrations)
RUN npm install

# Copy backend source code
COPY . .

# Ensure entrypoint is executable
RUN chmod +x docker-entrypoint.sh

# Expose server port
EXPOSE 5000

# Default environment configuration
ENV NODE_ENV=production
ENV PORT=5000

# Run migrations and start server via entrypoint
ENTRYPOINT ["./docker-entrypoint.sh"]
