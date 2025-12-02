# ¿Qué? - Quiz Application

A full-stack quiz application built with React (TypeScript) and ASP.NET Core, allowing users to create, take, and manage quizzes with authentication and scoring features.

## Features

### User Management
- User registration and login with JWT authentication
- Session management with automatic logout on token expiry
- User profile with quiz history and statistics

### Quiz Management
- Create custom quizzes with multiple questions
- Support for single-answer and multiple-answer questions
- Edit and delete your own quizzes
- Public/private quiz visibility settings
- Rich metadata (category, difficulty, time limit, description)

### Quiz Taking
- Interactive quiz interface with countdown timer
- Progress tracking and question navigation
- Auto-submit when time expires
- Partial scoring for multiple-choice questions
- Detailed results page with answer review
- Quiz retake functionality

### Search & Filtering
- Search quizzes by name, description, or category
- Filter by category, difficulty level, and quiz length
- Responsive grid layout with pagination
- "Load More" functionality for large quiz lists

## Technology Stack

### Frontend
- **React 18** with TypeScript
- **Vite** - Fast build tool and dev server
- **React Router** - Client-side routing
- **React Bootstrap** - UI components
- **Bootstrap Icons** - Icon library
- **JWT Decode** - Token parsing

### Backend
- **ASP.NET Core 8.0** - Web API framework
- **Entity Framework Core 8.0** - ORM
- **SQLite** - Database
- **JWT Bearer Authentication** - Secure authentication
- **Serilog** - Structured logging with file rotation


## Getting Started

### Prerequisites
- **Node.js** (v18 or higher)
- **.NET SDK 8.0** or higher
- **Git**

### Installation

1. **Clone the repository**
```bash
git clone https://github.com/s369519/QueEksamen.git
cd QueEksamen
```

2. **Setup Backend**
```bash
cd api
dotnet restore
dotnet ef database update --context QuizDbContext
dotnet ef database update --context AuthDbContext
```

3. **Setup Frontend**
```bash
cd ../que
npm install
```

### Configuration

Create a `.env` file in the `que` folder:
```env
VITE_API_URL=http://localhost:5113
```

### Running the Application

1. **Start Backend (Terminal 1)**
```bash
cd api
dotnet run
```
Backend will run on `http://localhost:5113`

2. **Start Frontend (Terminal 2)**
```bash
cd que
npm run dev
```
Frontend will run on `http://localhost:5173`

3. **Open your browser** and navigate to `http://localhost:5173`

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user
- `POST /api/auth/logout` - Logout user

### Quizzes
- `GET /api/quizapi/quizlist` - Get all quizzes
- `GET /api/quizapi/{id}` - Get quiz by ID
- `POST /api/quizapi/create` - Create new quiz
- `PUT /api/quizapi/update/{id}` - Update quiz
- `DELETE /api/quizapi/delete/{id}` - Delete quiz
- `GET /api/quizapi/take/{id}` - Get quiz for taking (without answers)
- `POST /api/quizapi/take/answer` - Submit answer
- `GET /api/quizapi/results/{id}` - Get quiz results
- `GET /api/quizapi/user/quizzes` - Get user's quizzes
- `GET /api/quizapi/user/attempts` - Get user's quiz attempts
- `POST /api/quizapi/submit-attempt` - Submit quiz attempt

### Users
- `GET /api/users/profile` - Get user profile

## Key Features Explained

### Authentication Flow
1. User registers/logs in
2. Backend generates JWT token with 2-hour expiry
3. Token stored in localStorage
4. Token included in Authorization header for protected routes
5. Automatic logout on token expiry

### Quiz Taking Flow
1. User starts quiz (timer begins)
2. Navigate between questions (answers saved)
3. Submit quiz (manual or auto-submit on timeout)
4. Each answer scored individually with partial credit
5. Results displayed with detailed review

### Scoring System
- Single-answer questions: 1.0 or 0.0 points
- Multiple-answer questions: Partial credit based on:
  - Correct selections: +points
  - Incorrect selections: -points
  - Final score clamped between 0.0 and 1.0

## Database

The application uses two SQLite databases:

1. **QuizDb.db** - Stores quizzes, questions, options
2. **AuthDb.db** - Stores user accounts

### Initial Data
The database is seeded with 3 sample quizzes:
- General Knowledge (3 questions)
- Programming Basics (2 questions)
- Math Quiz (2 questions)

## Security

- Passwords hashed using ASP.NET Core Identity
- JWT tokens with configurable expiry
- Protected API endpoints require authentication
- CORS configured for development
- Global exception handling middleware

## Build for Production

### Frontend
```bash
cd que
npm run build
```
Output in `que/dist/`

### Backend
```bash
cd api
dotnet publish -c Release
```
Output in `api/bin/Release/net8.0/publish/`

## Troubleshooting

### Port Conflicts
- Backend port: Change in `api/Properties/launchSettings.json`
- Frontend port: Change in `que/vite.config.js`

### Database Issues
```bash
cd api
dotnet ef database drop --context QuizDbContext
dotnet ef database drop --context AuthDbContext
dotnet ef database update --context QuizDbContext
dotnet ef database update --context AuthDbContext
```

### CORS Errors
Ensure `VITE_API_URL` in `.env` matches backend URL

## Authors

- Erik Grimstveit s385500
- Da Quynh Truong s385550
- Zoey Retzius s380936
- Sara Solstad Wessel-Hansen s385572
- Arthur Thonrud Flotvik s369519


## License

This project is created for educational purposes as part of an exam project.

## Acknowledgments

- ASP.NET Core documentation
- React documentation
- Bootstrap documentation
- Entity Framework Core documentation
