# Aureo ✨ - Gestión Financiera Personal

<div align="center">

![Aureo Logo](https://img.shields.io/badge/Aureo-Financial%20Management-D4AF37?style=for-the-badge&logo=chart-line)

![React](https://img.shields.io/badge/React-18+-61DAFB?style=flat-square&logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5+-3178C6?style=flat-square&logo=typescript)
![Vite](https://img.shields.io/badge/Vite-5+-646CFF?style=flat-square&logo=vite)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3+-06B6D4?style=flat-square&logo=tailwindcss)
![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js)
![Express](https://img.shields.io/badge/Express-4+-000000?style=flat-square&logo=express)
![Prisma](https://img.shields.io/badge/Prisma-5+-2D3748?style=flat-square&logo=prisma)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-15+-4169E1?style=flat-square&logo=postgresql)
![Supabase](https://img.shields.io/badge/Supabase-Ready-3ECF8E?style=flat-square&logo=supabase)

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=flat-square)](https://opensource.org/licenses/MIT)

**Aureo** is a modern, elegant, and mobile-first personal financial management web application that helps you track expenses, manage budgets, and achieve your financial goals.

</div>

---

## 📋 Table of Contents

- [✨ Features](#-features)
- [🎨 Design](#-design)
- [📁 Project Structure](#-project-structure)
- [🚀 Getting Started](#-getting-started)
- [📊 Database](#-database)
- [🔐 Environment Variables](#-environment-variables)
- [🛠️ Available Scripts](#️-available-scripts)
- [📱 API Endpoints](#-api-endpoints)
- [🧪 Testing](#-testing)
- [🚢 Deployment](#-deployment)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Features

- 📊 **Expense Tracking** - Log and categorize your expenses effortlessly
- 💰 **Budget Management** - Set budgets and monitor your spending
- 📈 **Visual Analytics** - Beautiful charts and insights into your finances
- 🔄 **Real-time Sync** - Keep your data synchronized across devices
- 🔐 **Secure Authentication** - JWT-based authentication
- 📱 **Mobile-First Design** - Optimized for all screen sizes
- 🎯 **Financial Goals** - Set and track your financial objectives
- 🔔 **Smart Notifications** - Get alerts for important financial events

---

## 🎨 Design

Aureo features a sophisticated, minimalist design with a golden accent color:

- **Primary:** `#D4AF37` (Golden/Aureo)
- **Secondary:** `#1A1A1A` (Elegant Black)
- **Success:** `#2E7D32` (Green)
- **Danger:** `#C62828` (Red)
- **Background:** `#FAFAFA` (Almost White)

**Font:** Inter / Poppins

The design is mobile-first, elegant, and uses the golden color sparingly for accents and important elements.

---

## 📁 Project Structure

```
aureo/
├── 📱 client/                    # Frontend React application
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   └── ui/             # Shadcn/ui components
│   │   ├── pages/              # Page components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── lib/                # Utility functions
│   │   ├── services/           # API service calls
│   │   ├── store/              # State management
│   │   ├── types/              # TypeScript type definitions
│   │   ├── assets/             # Images, fonts, etc.
│   │   └── App.tsx             # Main app component
│   ├── public/                 # Static assets
│   └── package.json
│
├── 🖥️ server/                    # Backend Express application
│   ├── src/
│   │   ├── controllers/        # Request handlers
│   │   ├── routes/             # API routes
│   │   ├── middleware/         # Custom middleware
│   │   ├── services/           # Business logic
│   │   ├── utils/              # Utility functions
│   │   ├── types/              # TypeScript types
│   │   └── index.ts            # Server entry point
│   ├── prisma/                 # Database schema & migrations
│   │   └── schema.prisma       # Prisma schema
│   └── package.json
│
├── 📊 database/                 # Database seeds & scripts
├── 📄 .env.example             # Environment variables template
├── 📄 .gitignore               # Git ignore rules
├── 📄 docker-compose.yml       # Local development setup
├── 📄 README.md                # This file
└── 📄 package.json             # Root package.json
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 9.0.0
- **PostgreSQL** >= 15 (or Supabase account)
- **Git**

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/aureo.git
   cd aureo
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` with your configuration (see [Environment Variables](#-environment-variables))

4. **Set up the database**
   ```bash
   # Using local PostgreSQL
   docker-compose up -d
   
   # Or configure Supabase in .env
   
   # Run Prisma migrations
   npm run db:migrate
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

   This will start:
   - Client: `http://localhost:5173`
   - Server: `http://localhost:3001`

---

## 📊 Database

### Using Local PostgreSQL (Docker)

```bash
# Start PostgreSQL and pgAdmin
docker-compose up -d

# Access pgAdmin at http://localhost:5050
# Email: admin@aureo.app
# Password: admin
```

### Using Supabase

1. Create a free account at [Supabase](https://supabase.com)
2. Create a new project
3. Go to Project Settings > Database
4. Copy the connection string
5. Update `DATABASE_URL` in your `.env`

### Database Migrations

```bash
# Generate Prisma client
npm run db:generate

# Run migrations
npm run db:migrate

# Open Prisma Studio (database GUI)
npm run db:studio
```

---

## 🔐 Environment Variables

Create a `.env` file in the root directory with the following variables:

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `DATABASE_URL` | PostgreSQL connection string | - | ✅ |
| `JWT_SECRET` | Secret key for JWT tokens | - | ✅ |
| `JWT_EXPIRES_IN` | Token expiration time | `7d` | ✅ |
| `PORT` | Server port | `3001` | ✅ |
| `NODE_ENV` | Environment | `development` | ✅ |
| `CLIENT_URL` | Frontend URL | `http://localhost:5173` | ✅ |
| `SUPABASE_URL` | Supabase project URL | - | ❌ |
| `SUPABASE_KEY` | Supabase API key | - | ❌ |
| `SMTP_HOST` | Email SMTP host | `smtp.gmail.com` | ❌ |
| `SMTP_PORT` | Email SMTP port | `587` | ❌ |
| `SMTP_USER` | Email username | - | ❌ |
| `SMTP_PASSWORD` | Email password | - | ❌ |

---

## 🛠️ Available Scripts

### Development

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both client and server in development mode |
| `npm run dev:client` | Start only the client dev server |
| `npm run dev:server` | Start only the server in watch mode |

### Production

| Command | Description |
|---------|-------------|
| `npm run build` | Build both client and server |
| `npm run build:client` | Build the client for production |
| `npm run build:server` | Build the server for production |
| `npm start` | Start the production server |

### Database

| Command | Description |
|---------|-------------|
| `npm run db:migrate` | Run database migrations |
| `npm run db:generate` | Generate Prisma client |
| `npm run db:studio` | Open Prisma Studio |

### Code Quality

| Command | Description |
|---------|-------------|
| `npm run lint` | Run linter on all packages |

---

## 📱 API Endpoints

### Authentication

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Create a new account |
| `POST` | `/api/auth/login` | Login with email/password |
| `POST` | `/api/auth/logout` | Logout current user |
| `GET` | `/api/auth/me` | Get current user profile |
| `POST` | `/api/auth/forgot-password` | Request password reset |
| `POST` | `/api/auth/reset-password` | Reset password with token |

### Transactions

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/transactions` | Get all transactions |
| `GET` | `/api/transactions/:id` | Get single transaction |
| `POST` | `/api/transactions` | Create new transaction |
| `PUT` | `/api/transactions/:id` | Update transaction |
| `DELETE` | `/api/transactions/:id` | Delete transaction |

### Budgets

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/budgets` | Get all budgets |
| `POST` | `/api/budgets` | Create new budget |
| `PUT` | `/api/budgets/:id` | Update budget |
| `DELETE` | `/api/budgets/:id` | Delete budget |

---

## 🧪 Testing

```bash
# Run tests (coming soon)
npm test

# Run tests with coverage
npm run test:coverage
```

---

## 🚢 Deployment

### Frontend (Vercel)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd client
vercel
```

### Backend (Render/Railway)

1. Connect your GitHub repository
2. Set build command: `npm run build:server`
3. Set start command: `npm start`
4. Add environment variables

### Database (Supabase)

Simply use your Supabase project URL in the production `DATABASE_URL`.

---

## 🤝 Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the project
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Made with ❤️ by the Aureo Team**

⭐ Star this repo if you find it helpful!

</div>
