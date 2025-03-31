import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { API_URL } from '../../utils/constants';
import './Login.css';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch(`${API_URL}/login`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                credentials: 'include',
                mode: 'cors',
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok && data.access_token) {
                login(data.access_token, email);
                navigate('/');
            } else {
                setError(data.detail || 'Login failed. Please try again.');
            }
        } catch (error) {
            console.error('Login error:', error);
            setError('Connection error. Please try again later.');
        }
    };

    return (
        <div className="page-wrapper">
        <div className="login-container">
            <form className="login-form" onSubmit={handleLogin}>
                <h2>Login to BatterySync</h2>

                <div className="form-group">
                    <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email"
                        required
                    />
                </div>

                <div className="form-group">
                    <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        placeholder="Password"
                        required
                    />
                </div>

                <button type="submit">Login</button>

                {error && <p className="error-message">{error}</p>}

                <p className="signup-link">
                    Don't have an account? <Link to="/signup">Sign up</Link>
                </p>
            </form>
        </div>
    </div>
    );
};

export default Login;