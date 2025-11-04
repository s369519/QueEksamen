import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { Container } from 'react-bootstrap'
import HomePage from "./home/HomePage"
import QuizListPage from './quizes/QuizListPage'
import QuizCreatePage from './quizes/QuizCreatePage'
import QuizUpdatePage from './quizes/QuizUpdatePage'
import TakeQuizPage from './quizes/TakeQuizPage'
import NavMenu from './shared/NavMenu'
import LoginPage from './auth/LoginPage'
import RegisterPage from './auth/RegisterPage'
import ProtectedRoute from './auth/ProtectedRoute'
import { AuthProvider } from './auth/AuthContext'
import './App.css'

const App: React.FC = () => {
  return (
    <AuthProvider>
      <Router>
        <NavMenu />
        <Container className='mt-4'>
          <Routes>
            <Route path='/' element={<HomePage />} />
            <Route path='/quizes' element={<QuizListPage />} />
            <Route path='/quiztake/:id' element={<TakeQuizPage />} />
            <Route path='/login' element={<LoginPage />} />
            <Route path='/register' element={<RegisterPage />} />

            <Route element={<ProtectedRoute />}>
              <Route path='/quizcreate' element={<QuizCreatePage />} />
              <Route path='/quizupdate/:quizId' element={<QuizUpdatePage />}/>
            </Route>

            <Route path='*' element={<Navigate to="/" replace />} />
          </Routes>
        </Container>
      </Router>
    </AuthProvider>
  )
}

export default App