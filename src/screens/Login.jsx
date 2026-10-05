import { useState } from 'react';
import '../Styles/Login.css';
import logo from '../assets/splash-logo.png';

function Login({ onLoginSuccess, onSignup }) {
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previousData) => ({
      ...previousData,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setError('');
    setIsLoading(true);

    try {
      const response = await fetch(
        'https://aidconnect-l105.onrender.com/api/auth/login',
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: formData.email,
            password: formData.password,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        setError(data.message || 'Unable to login');
        return;
      }

      localStorage.setItem(
        'aidconnect_token',
        data.token
      );

      localStorage.setItem(
        'aidconnect_user',
        JSON.stringify(data.user)
      );

      console.log('Login successful:', data.user);

      onLoginSuccess();

    } catch (error) {
      console.error('Login request failed:', error);

      setError('Unable to connect to the server');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="login-screen">

      {/* Soft background accents */}
      <div className="login-glow login-glow-blue"></div>
      <div className="login-glow login-glow-red"></div>

      <div className="login-container">

        {/* AidConnect Logo */}
        <div className="login-brand">
          <img
            src={logo}
            alt="AidConnect"
            className="login-logo"
          />
        </div>

        {/* Heading */}
        <div className="login-heading">
          <h1>AidConnect welcomes you back</h1>

          <p>
            Login to continue with AidConnect.
          </p>
        </div>

        {/* Login Card */}
        <div className="login-card">

          <form onSubmit={handleSubmit}>

            <div className="form-group">
              <label htmlFor="email">
                Email
              </label>

              <input
                type="email"
                id="email"
                name="email"
                placeholder="Enter your email"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">
                Password
              </label>

              <input
                type="password"
                id="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>

            {error && (
              <p className="form-error">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={isLoading}
            >
              {isLoading
                ? 'Logging in...'
                : 'Login'}
            </button>

          </form>

        </div>

        {/* Signup */}
        <p className="signup-link">
          Don't have an account?{' '}

          <button
            type="button"
            onClick={onSignup}
            className="signup-link-button"
          >
            Sign Up
          </button>
        </p>

      </div>
    </main>
  );
}

export default Login;