# Horus Signup - Vite + React

This project is a simple landing page with a floating signup form overlay, built with Vite and React. It includes basic JWT authentication elements (simulated).

## Project Structure

- `public/`: Static assets.
- `src/`:
  - `assets/`: Images and other assets like logos.
  - `components/`:
    - `SignupForm.tsx`: The floating signup form component.
    - `SignupForm.css`: Styles for the signup form.
  - `services/`:
    - `AuthService.ts`: A mock authentication service for handling JWT (simulated signup, login, logout, token management).
  - `App.tsx`: The main application component that includes the landing page content and logic to show/hide the signup form.
  - `App.css`: Styles for the main application and landing page elements.
  - `main.tsx`: The entry point of the React application.
  - `index.css`: Global styles.
  - `vite-env.d.ts`: TypeScript definitions for Vite environment variables.
- `.github/copilot-instructions.md`: Instructions for GitHub Copilot.
- `index.html`: The main HTML file.
- `package.json`: Project dependencies and scripts.
- `tsconfig.json`: TypeScript configuration.
- `tsconfig.node.json`: TypeScript configuration for Node.js environment (e.g., Vite config).
- `vite.config.ts`: Vite configuration file.

## Features

- Vite + React + TypeScript setup.
- Floating signup form overlay.
- Basic client-side form validation.
- Simulated JWT authentication (signup, login, logout).
  - Token is stored in `localStorage`.
- Buttons to trigger signup, login (simulated), and logout.

## Getting Started

### Prerequisites

- Node.js (version 18.x or 20.x recommended)
- npm (comes with Node.js)

### Installation

1.  **Clone the repository (or ensure you are in the project directory if already created):**
    ```bash
    # If you cloned it, navigate into the project directory
    # cd your-project-name
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

### Running the Development Server

To start the development server, run:

```bash
npm run dev
```

This will typically start the application on `http://localhost:5173` (the port might vary if 5173 is in use).

## How to Use

1.  Open the application in your browser.
2.  You will see a basic landing page.
3.  Click the "Sign Up" button to open the signup form overlay.
4.  Fill in the form and submit. A successful signup will be simulated, and the token will be stored in local storage.
5.  Click the "Login (Simulated)" button to simulate a login. This will also store a token.
6.  Once "logged in" (simulated), a "Logout" button will appear. Clicking it will clear the stored token.

## JWT Authentication (Simulated)

The `src/services/AuthService.ts` file contains a mock authentication service. 

-   **`signup(email, password)`**: Simulates a user signup. On success (e.g., `email: test@example.com`, `password: password`), it generates a fake JWT, stores it in `localStorage`, and resolves.
-   **`login(email, password)`**: Simulates a user login. On success (e.g., `email: test@example.com`, `password: password`), it generates a fake JWT, stores it in `localStorage`, and resolves.
-   **`logout()`**: Removes the JWT from `localStorage`.
-   **`getToken()`**: Retrieves the JWT from `localStorage`.
-   **`isAuthenticated()`**: Checks if a JWT exists in `localStorage`.

**Note:** This is a client-side simulation. For a real application, you would need a backend server to handle user registration, login, JWT generation, and validation.

## Further Development

-   Implement a real backend for authentication (e.g., using Node.js/Express, Python/Django/Flask, etc.).
-   Connect the `SignupForm` to the `AuthService.signup` method properly.
-   Add more robust form validation (client-side and server-side).
-   Implement proper error handling and user feedback.
-   Create a separate login form/component.
-   Protect routes based on authentication status.
-   Add state management (e.g., Context API, Redux, Zustand) for more complex applications.

This README provides a basic overview. You can expand it with more details as the project grows.
