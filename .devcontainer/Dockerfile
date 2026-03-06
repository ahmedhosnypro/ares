FROM mcr.microsoft.com/devcontainers/dotnet:latest

# Install additional tools
RUN apt-get update && apt-get install -y \
    git \
    curl \
    wget \
    vim \
    nano \
    htop \
    net-tools \
    gnupg \
    && rm -rf /var/lib/apt/lists/*

# Install .NET tools for development
RUN dotnet tool install -g dotnet-ef || true
RUN dotnet tool install -g dotnet-aspnet-codegenerator || true

ENV PATH=$PATH:/root/.dotnet/tools