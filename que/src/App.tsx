import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import HomePage from "./home/HomePage"
import QuizListPage from './quizes/QuizListPage'
import QuizCreatePage from './quizes/QuizCreatePage'
import QuizUpdatePage from './quizes/QuizUpdatePage'
import TakeQuizPage from './quizes/TakeQuizPage'
import NavMenu from './shared/NavMenu'
import Footer from './shared/Footer'
import LoginPage from './auth/LoginPage'
import ProtectedRoute from './auth/ProtectedRoute'
import { AuthProvider } from './auth/AuthContext'
import Profile from './views/Profile/Profile'

import './App.css'

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <div className="d-flex flex-column min-vh-100">
          <NavMenu />
          <main className="flex-grow-1">
            <Routes>
              <Route path='/' element={<HomePage />} />
              <Route path='/quizes' element={<QuizListPage />} />
              <Route path='/quiztake/:id' element={<TakeQuizPage />} />

              {/* Combines login+register page */}
              <Route path='/login' element={<LoginPage />} />
              <Route path="/register" element={<LoginPage />} />

              <Route element={<ProtectedRoute />}>
                <Route path='/quizcreate' element={<QuizCreatePage />} />
                <Route path='/quizupdate/:quizId' element={<QuizUpdatePage />}/>
                <Route path='/profile' element={<Profile />} />
              </Route>

              <Route path='*' element={<Navigate to="/" replace />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </Router>
    </AuthProvider>
  )
}

export default App