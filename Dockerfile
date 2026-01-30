FROM ubuntu:24.04

# Set working directory
WORKDIR /usr/src/app

# Copy package manifest first (cache deps)
COPY package*.json ./

# Install dependencies
RUN npm ci --production

# Copy project code
COPY . .

# Expose default port
EXPOSE 9080

# Set environment (optional)
ENV NODE_ENV=production

# Default command to start the server
CMD ["npm", "start"]
