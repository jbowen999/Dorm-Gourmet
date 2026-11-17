import { Link } from 'react-router-dom'
import { useAuth } from '../AuthContext.jsx'
import AuthForm from '../components/AuthForm.jsx'

export default function Login() {
  const { login } = useAuth()
  return (
    <>
      <AuthForm title="Log in" submitLabel="Login" onSubmit={login} />
      <p className="auth-switch">
        No account yet? <Link to="/register">Register</Link>
      </p>
    </>
  )
}
