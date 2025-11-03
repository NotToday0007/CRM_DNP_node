# Use Node 18
FROM node:18

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Copy all project files
COPY . .

# Make sure lead_data.json exists
RUN if [ ! -f lead_data.json ]; then echo '{}' > lead_data.json; fi

# Expose port
EXPOSE 3000

# Start server
CMD ["node", "server.js"]
