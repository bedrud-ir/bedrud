# Deployment Guide

This page explains how the Bedrud project is deployed to a server.

## Infrastructure
The project uses **Docker Compose** to run supporting services:
*   **PostgreSQL:** The main database.
*   **Redis:** Used for caching and session data.
*   **LiveKit:** The server that handles video and audio streams.
*   **Traefik:** A proxy that manages SSL (HTTPS) and routes traffic to the right place.

## Backend Service
The main backend is NOT running in Docker. Instead, it runs naturally on the server as a **Systemd Service**. This makes it easy to update and restart.
*   The service file is located at `deploy/bedrud.service`.

## Important Scripts
There are several scripts in the `deploy/` folder to help with server management:

### 1. `deploy.sh`
This script does a full update:
*   Builds the backend and frontend.
*   Sends everything to the server.
*   Restarts the services.

### 2. `push.sh`
A faster version of `deploy.sh`. Use this if you only changed the backend code and want to update quickly.

### 3. `start.sh` and `stop.sh`
Used to quickly start or stop the Docker infrastructure on the server.

### 4. `setup_wg.sh`
Sets up a WireGuard VPN. This is used for secure communication between developers and the server.

## Configuration
*   **`config.prod.yaml`**: The main configuration file for the production server.
*   **`traefik.yaml`**: Configuration for the Traefik proxy.
