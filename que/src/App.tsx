import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Container } from 'react-bootstrap'
import HomePage from "./home/HomePage"
import QuizListPage from './quizes/QuizListPage'
import QuizCreatePage from './quizes/QuizCreatePage'
import QuizUpdatePage from './quizes/QuizUpdatePage'
import TakeQuizPage from './quizes/TakeQuizPage'
import NavMenu from './shared/NavMenu'
import LoginPage from './auth/LoginPage'
import ProtectedRoute from './auth/ProtectedRoute'
import { AuthProvider } from './auth/AuthContext'
import Profile from './views/Profile/Profile'

import './App.css'

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <NavMenu />
        <Container className='mt-4 main-content'>
          <Routes>
            <Route path='/' element={<HomePage />} />
            <Route path='/quizes' element={<QuizListPage />} />
            <Route path='/quiztake/:id' element={<TakeQuizPage />} />

            /* Combines login+register page
            <Route path='/login' element={<LoginPage />} />
            <Route path="/register" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path='/quizcreate' element={<QuizCreatePage />} />
              <Route path='/quizupdate/:quizId' element={<QuizUpdatePage />}/>
              <Route path='/profile' element={<Profile />} /> //NY kode
            </Route>

            <Route path='*' element={<Navigate to="/" replace />} />
          </Routes>
        </Container>

        <footer className="app-footer">
          © 2025 Qué Quiz App — All rights reserved.
        </footer>


      </Router>
    </AuthProvider>
  )
}

export default App