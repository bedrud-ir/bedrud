# Backend Guide

The Bedrud backend is built with [Go](https://go.dev/) and the [Fiber](https://gofiber.io/) web framework. It handles users, meeting rooms, and authentication.

## Core Technologies
*   **Go (Golang):** The programming language.
*   **Fiber:** The web framework for building APIs.
*   **GORM:** A tool to talk to the PostgreSQL database.
*   **LiveKit:** Used to manage video and audio for meetings.
*   **Goth:** Used for social login (OAuth).

## Folder Structure
*   `cmd/server`: The starting point of the application.
*   `internal/auth`: Logic for login, signup, and OAuth.
*   `internal/database`: Connects to the database and creates tables (migrations).
*   `internal/handlers`: Defines what happens when you visit an API URL (e.g., `/api/room/create`).
*   `internal/models`: defines how data looks (User, Room, etc.).
*   `internal/repository`: The code that saves and gets data from the database.

## Main Data Models

### User
A user has an email, name, password (encrypted), and an avatar. Users can also log in with Google or GitHub.

### Room
A room is where meetings happen. It has:
*   **Name:** Unique name for the room.
*   **Admin:** The person who created the room (AdminID).
*   **Public/Private:** Rooms can be public or private.
*   **Settings:** Can users chat? Can they use video?
*   **Participants:** List of users currently in the room.

## API Endpoints

### Authentication
*   `POST /api/auth/register`: Create a new account.
*   `POST /api/auth/login`: Log in to an account.
*   `POST /api/auth/guest-login`: Join as a guest with just a name.
*   `GET /api/auth/me`: Get your own user information.
*   `GET /api/auth/:provider/login`: Start social login.

### Room Management
*   `POST /api/room/create`: Create a new meeting room.
*   `POST /api/room/join`: Join a room and get a token for LiveKit.
*   `GET /api/room/list`: Get a list of rooms you can join.
*   `POST /api/room/:roomId/kick/:identity`: Kick a participant (Admin only).
*   `POST /api/room/:roomId/mute/:identity`: Mute a participant (Admin only).
*   `POST /api/room/:roomId/video/:identity/off`: Disable participant video (Admin only).

### Admin
*   `GET /api/admin/users`: List all users (Superadmin only).
*   `PUT /api/admin/users/:id/status`: Activate or deactivate a user.
