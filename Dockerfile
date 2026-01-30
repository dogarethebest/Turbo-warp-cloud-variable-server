FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive
WORKDIR /usr/src/app

# ---- Install system deps ----
RUN apt-get update && \
    apt-get install -y \
        curl \
        ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# ---- Install Node.js 20 + npm ----
RUN curl -fsSL https://deb.nodesource.com/setup_20.x | bash - && \
    apt-get install -y nodejs

# (Optional sanity check – highly recommended)
RUN node -v && npm -v

# ---- Copy dependency manifests FIRST ----
COPY package.json package-lock.json ./

# ---- Install npm dependencies ----
RUN npm ci --omit=dev

# ---- Copy rest of the application ----
COPY . .

EXPOSE 9080
CMD ["npm", "start"]
