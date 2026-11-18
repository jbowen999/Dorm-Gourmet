import { Link } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";
import AuthForm from "../components/AuthForm.jsx";
import "./Register.css";

export default function Register() {
  const { register } = useAuth();
  return (
    <>
      <AuthForm
        title="Create an account"
        submitLabel="Register"
        onSubmit={register}
      />
      <p className="register-switch">
        Already registered? <Link to="/login">Log in</Link>
      </p>
    </>
  );
}
