# Use a lightweight Node.js 18 base image
FROM node:18-bullseye-slim

# Install Python, pip, and system libraries required by OpenCV & TensorFlow
RUN apt-get update && apt-get install -y --no-install-recommends \
    python3 \
    python3-pip \
    python3-dev \
    build-essential \
    libgl1-mesa-glx \
    libglib2.0-0 \
    && rm -rf /var/lib/apt/lists/*

# Symlink python to python3
RUN ln -s /usr/bin/python3 /usr/bin/python

# Set working directory
WORKDIR /app

# Copy Python requirements first and install them
COPY requirements.txt .
RUN pip3 install --no-cache-dir --upgrade pip && \
    pip3 install --no-cache-dir -r requirements.txt

# Copy Node.js dependencies configuration and install npm packages
COPY package.json package-lock.json* ./
RUN npm install --production

# Copy the rest of the backend source files
COPY . .

# Set environment variable to run python scripts correctly
ENV PYTHON_PATH=python

# Expose the application port
EXPOSE 10000

# Start the Node.js Express server
CMD ["npm", "start"]
