# Home Budget App

A full-stack personal budget management application built with React, Express, and MySQL.

## Tech Stack

- **Frontend**: React 18, Tailwind CSS v4, Redux Toolkit, Highcharts
- **Backend**: Node.js, Express 5
- **Database**: MySQL / MariaDB
- **Build Tool**: Webpack 5
- **UI Components**: shadcn/ui (Radix UI primitives)

## Prerequisites

- Node.js 18+ and npm
- MySQL / MariaDB database
- (Optional) Docker and Docker Compose

## Setup

### 1. Clone and Install

```bash
git clone <your-repo-url>
cd home-budget
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your database credentials:

```bash
cp .env.example .env
```

Edit `.env`:
```
PORT=8083
DB_HOST=localhost
DB_PORT=3306
DB_USER=your_database_user
DB_PASSWORD=your_database_password
DB_DATABASE=home_budget
```

### 3. Database Setup

Create the database and tables (you'll need to set up your schema). The app expects tables:
- `users`
- `category`
- `subCategory`
- `spendings`

### 4. Run Development Server

**Frontend + Backend (dev mode):**
```bash
npm start
```
Opens at [http://localhost:3000](http://localhost:3000) (webpack-dev-server)

**Backend only:**
```bash
npm run server
```
Runs Express server on port 8083 (or PORT from .env)

### 5. Build for Production

```bash
npm run build
```

Outputs to `build/` directory. Then run:
```bash
npm run server
```

## Docker

### Build and Run

```bash
docker compose up --build
```

The app will be available at [http://localhost:8083](http://localhost:8083)

### Docker Compose

The `docker-compose.yml` includes:
- Multi-stage Docker build (frontend + backend)
- Health check for container orchestration
- Environment file support (`.env`)

## Project Structure

```
home-budget/
├── src/                    # React frontend source
│   ├── components/         # UI components (shadcn/ui)
│   ├── main/              # Main app pages
│   │   ├── DashBoard.js
│   │   ├── ReportsPage.js
│   │   ├── EditDatabase.js
│   │   └── api/           # API client
│   └── store/             # Redux store
├── controllers/            # Express route handlers
├── models/                 # Database connection
├── routes/                 # Express routes
├── public/                 # Static assets
├── server.js               # Express server entry
└── webpack.config.js       # Webpack configuration
```

## API Endpoints

- `GET /api/spendings` - Get all spendings (optional query: `?startDate=YYYY-MM-DD&endDate=YYYY-MM-DD`)
- `POST /api/spendings` - Create new spending
- `POST /api/spendings/delete/:id` - Delete spending
- `GET /api/users` - Get all users
- `POST /api/users` - Create user
- `GET /api/categories` - Get all categories
- `POST /api/categories` - Create category
- `GET /api/subCategories/:id` - Get subcategories (id="0" for all)
- `POST /api/subCategories/:id` - Create subcategory

## Features

- 📊 Dashboard with recent spendings
- 📈 Reports with date range filtering and charts
- 🗄️ Database management (categories, subcategories, users)
- 🌓 Dark/Light theme support
- 📱 Responsive design

## Development Notes

- Uses Tailwind CSS v4 with CSS-first configuration (`@theme` in `src/index.css`)
- No `tailwind.config.js` needed (theme defined in CSS)
- Webpack handles both frontend build and dev server
- Redux Toolkit for state management

## License

Private project
