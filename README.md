# Light Management System

A comprehensive CRM and management system composed of a modern dashboard frontend and a robust backend API.

## Project Overview

The Light Management System handles client relationship management (CRM) features, allowing for efficient tracking and management of client data. The system is split into two main components:
- **Frontend**: A responsive and interactive admin dashboard.
- **Backend**: A RESTful API handling data persistence, authentication, and business logic.

## Technologies Used

The project leverages a modern and robust technical stack to ensure performance, scalability, and developer experience.

### Frontend
- **Core Framework**: [React](https://react.dev/) (v18) with [Vite](https://vitejs.dev/) for build tooling.
- **Styling & UI**:
    - [Tailwind CSS](https://tailwindcss.com/) (v4) for utility-first styling.
    - [Radix UI](https://www.radix-ui.com/) (Primitives) for accessible, unstyled UI components (Dialogs, Dropdowns, Accordions, etc.).
    - [Lucide React](https://lucide.dev/) for iconography.
    - `class-variance-authority`, `clsx`, `tailwind-merge` for dynamic class management.
- **State Management**:
    - **Context API** for global state (Authentication).
    - **React Hooks** (`useState`, `useEffect`) for local component state.
- **Form Handling**: [React Hook Form](https://react-hook-form.com/) for efficient form validation and submission.
- **Data Visualization**: [Recharts](https://recharts.org/) for analytics charts and graphs.
- **Additional Components**:
    - [Sonner](https://sonner.emilkowal.ski/) for toast notifications.
    - [Vaul](https://vaul.emilkowal.ski/) for mobile-friendly drawers.
    - [Embla Carousel](https://www.embla-carousel.com/) for carousel sliders.
    - `input-otp` for one-time password inputs.

### Backend
- **Runtime Environment**: [Node.js](https://nodejs.org/).
- **Web Framework**: [Express.js](https://expressjs.com/) for REST API routing.
- **Database**: [MongoDB](https://www.mongodb.com/) with [Mongoose](https://mongoosejs.com/) ODM.
- **Authentication & Security**:
    - **JSON Web Tokens (JWT)** for stateless authentication.
    - **bcryptjs** for password hashing.
    - **cors** for Cross-Origin Resource Sharing.
- **File & Data Processing**:
    - **Multer** for handling multipart/form-data (file uploads).
    - **XML Tools** (`xml2js`, `xml2`, `@xmldom/xmldom`) for parsing and validating XML data import/export.
- **Utilities**:
    - `dotenv` for environment variable management.
    - `nodemon` for development hot-reloading.

## Architecture

### Frontend (Light Management Frontend)
Built with **Vite + React**.
- **UI Library**: Radix UI (primitives) with Tailwind CSS for styling.
- **Routing**: Client-side routing.
- **State/Data**: React hooks and context.
- **Visualization**: Recharts for data analytics.

### Backend (Light Management Backend)
Built with **Node.js + Express**.
- **Database**: MongoDB (via Mongoose).
- **Authentication**: JSON Web Tokens (JWT) & bcryptjs.
- **File Handling**: Multer for uploads.
- **Serialization**: XML support via `xml2js` / `xml2`.

## Prerequisites

- **Node.js** (v18+ recommended)
- **MongoDB** (Local instance or Atlas connection)
- **npm** or **yarn**

## Setup & Installation

### 1. Clone the Repository
```bash
git clone <repository_url>
cd light-management
```

### 2. Backend Setup
Navigate to the backend directory and install dependencies:
```bash
cd "Light Management Backend"
npm install
```

Configure environment variables:
Create a `.env` file based on `.env.example` and populate it with your MongoDB URI and JWT secrets.

Start the backend server:
```bash
npm start
# OR for development
npm run dev
```

### 3. Frontend Setup
Open a new terminal, navigate to the frontend directory, and install dependencies:
```bash
cd "Light Management Frontend"
npm install
```

Start the development server:
```bash
npm run dev
```
The frontend should now be accessible at `http://localhost:5173` (or the port shown in your terminal).

## Usage

1. Ensure both Backend and Frontend servers are running.
2. Access the Frontend via your browser.
3. Log in or create an account to access the dashboard features.

## License

ISC
