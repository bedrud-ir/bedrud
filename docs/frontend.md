# Frontend Guide

The Bedrud frontend is a modern web application built with [SvelteKit](https://kit.svelte.dev/). It is fast, responsive, and easy to use.

## Core Technologies
*   **SvelteKit:** The framework for the website and routing.
*   **Typescript:** Makes the code safer and easier to read.
*   **Svelte Stores:** Used to manage things like the logged-in user and settings.
*   **LiveKit SDK:** Connects the browser to the video meeting server.
*   **TailwindCSS:** Used for styling the website (modern and clean design).

## Folder Structure
*   `src/routes`: Contains all the pages (Home, Login, Meetings, Admin).
*   `src/lib/components`: Reusable UI parts like buttons, cards, and video tiles.
*   `src/lib/stores`: These files remember data even when you change pages.
*   `src/lib/api`: Functions that talk to the Go backend.
*   `src/lib/api.ts`: A special helper (`authFetch`) that automatically adds your login token to requests.

## How Authentication Works
1.  **Login:** You enter your email and password.
2.  **Tokens:** The server gives you an "Access Token" and a "Refresh Token".
3.  **Storage:** The tokens are saved in your browser (LocalStorage or SessionStorage).
4.  **Security:** When you ask the server for data, `authFetch` sends the "Access Token" so the server knows who you are.
5.  **Guest Access:** If you are not logged in, you can join a meeting by providing just a name. The system creates a temporary user for you.
6.  **Refresh:** If the token expires, the app automatically tries to get a new one using the "Refresh Token".

## Main Pages
*   **Home (`/`):** The landing page where you can see common information.
*   **Auth (`/auth/login` & `/auth/register`):** Where you sign in or create an account.
*   **Dashboard (`/dashboard`):** Shows your rooms and history.
*   **Meeting (`/m/[meetId]`):** The most important page. This is where the video meeting happens using LiveKit. 
    *   **Admin Crown:** Shows a crown next to the room creator's name.
    *   **Admin Controls:** If you are the creator, you can kick, mute, or disable video for others.
*   **Admin (`/admin`):** Only for managers to see users and manage the system.

## Design System
The project uses a custom design system located in `src/routes/design-system`. This makes sure all buttons, fonts, and colors look consistent across the whole app.
