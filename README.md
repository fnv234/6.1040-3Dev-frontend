# 3Dev 360 Feedback Admin - Frontend

Colors (hex): 
A0CA92, 75B09C, 998650, B6C197, 8A9B68, 937B63, ABC8C0, 7EA2AA, 427AA1

A TypeScript + Vue 3 HR administration portal for managing customizable feedback forms, team members, and analyzing responses with optional LLM-powered insights.

## Features

- **HR Admin Authentication** - Secure login system for HR administrators
- **Team Management** - Create and manage teams with member email lists
- **Feedback Form Builder** - Create customizable forms with multiple question types:
  - Text responses
  - Rating scales (1-5)
  - Multiple choice questions
- **Dashboard Analytics** - View response statistics and team feedback summaries
- **Email Distribution** - Send feedback forms to team members via email
- **LLM-Powered Synthesis** - Optional AI-generated feedback summaries

## Tech Stack

- **Vue 3** with Composition API (`<script setup>`)
- **TypeScript** for type safety
- **Vite** for fast development and building
- **Vue Router** for navigation
- **Axios** for API communication

## Setup

```bash
npm install
```

## Development

```bash
npm run dev
```

The app runs at http://localhost:5173

## Type Checking

```bash
npm run type-check
```

## Production Build

```bash
npm run build
```

## Project Structure

```
src/
├── api/          # API client with typed endpoints
├── types/        # TypeScript type definitions
├── views/        # Main application views
│   ├── LoginView.vue
│   ├── DashboardView.vue
│   ├── TeamsView.vue
│   └── FormBuilderView.vue
├── router/       # Vue Router configuration
├── App.vue       # Root component with navigation
└── main.ts       # Application entry point
```

## Backend Configuration

The frontend connects to the backend API using the `VITE_API_BASE_URL` environment variable defined in `.env.production`:

```
VITE_API_BASE_URL=https://six-1040-3dev-backend.onrender.com
```

## Demo Usage

1. **Login**: Use any email/password to access the admin portal
2. **Create Teams**: Add team members by entering their email addresses
3. **Build Forms**: Create feedback forms with custom questions
4. **Send Forms**: Select a team and send the form (emails sent via backend)
5. **View Dashboard**: Monitor response rates and statistics