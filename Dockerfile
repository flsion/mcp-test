# Generated by https://smithery.ai. See: https://smithery.ai/docs/config#dockerfile
# Use a Node.js image
FROM node:18-alpine AS builder

# Set working directory
WORKDIR /app

# Copy package.json and package-lock.json to the working directory
COPY package.json package-lock.json ./

# Install project dependencies
RUN npm install

# Copy the entire project directory
COPY . .

# Build the project
RUN npm run build

# Start a new stage for the final image
FROM node:18-alpine AS release

# Set working directory
WORKDIR /app

# Copy the build files from the previous stage
COPY --from=builder /app/dist /app/dist
COPY --from=builder /app/package.json /app/package-lock.json /app/node_modules /app/

# Set the entry point to run the server
ENTRYPOINT ["node", "dist/index.js"]