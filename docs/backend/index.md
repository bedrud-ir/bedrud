# Backend Documentation Overview

Welcome to the Bedrud backend documentation. This guide is for developers who want to understand how the Bedrud server works.

## Introduction
The Bedrud backend is a high-performance, single-binary meeting platform written in **Go 1.24+**. Its unique selling point is the complete encapsulation of all dependencies—including the media server and web frontend—into a single executable.

This "Appliance Mode" architecture simplifies deployment to the extreme: you copy one binary, run one command, and you have a full WebRTC platform.

### Key Technologies
- **Core Framework:** [Fiber v2](https://gofiber.io/) (Zero allocation router, Express-like API).
- **Database Layer:** [GORM](https://gorm.io/) with support for **SQLite** (standard) and **PostgreSQL** (production).
- **Media Engine:** [LiveKit](https://livekit.io/) (Embedded as a sibling binary).
- **Auth System:** Multi-layered auth supporting JWT, OAuth2 (Google/GitHub/Twitter), and passwordless FIDO2 Passkeys.
- **Embedded Static Assets:** Uses Go 1.16+ `embed` package to bundle the Svelte 5 frontend.
- **Deployment:** Integrated Debian/Ubuntu auto-installer with systemd orchestration and ACME (Let's Encrypt) support.

## Why this Architecture?
Traditional WebRTC stacks require complex orchestration of multiple services (Turn servers, Signaling servers, Web servers, DB). Bedrud reduces this complexity by:

1.  **Extracting** the media server binary at runtime.
2.  **Proxying** media traffic through the main HTTP(S) port.
3.  **Automating** OS-level configuration (SSL, systemd) via the binary itself.

## High-Level Architecture
The backend follows a standard layered architecture:

1.  **Server Layer (`internal/server`):** Sets up the Fiber app, routes, and middleware.
2.  **Handler Layer (`internal/handlers`):** Manages HTTP requests and responses.
3.  **Repository Layer (`internal/repository`):** Handles database queries using GORM.
4.  **Model Layer (`internal/models`):** Defines the database tables and Go structures.
5.  **Service/Logic Layer:** Integrated into handlers and repositories for simplicity, with specialized packages like `internal/auth` and `internal/livekit`.

## Main Entry Point
The application starts in `server/cmd/bedrud/main.go`. It has three main modes:

- `run`: Starts the full meeting server.
- `livekit`: Starts only the embedded media server.
- `install`: Automatically sets up the server on Debian/Ubuntu systems.

## Documentation Sections
- [**Code Structure**](structure.md): Where is everything located?
- [**Database & Models**](database.md): How is data stored?
- [**Authentication**](authentication.md): How do users log in?
- [**API Handlers**](api-handlers.md): How are requests processed?
- [**LiveKit Integration**](livekit.md): How does the video server work?
- [**Installation & Deployment**](deployment.md): How does the auto-installer work?
