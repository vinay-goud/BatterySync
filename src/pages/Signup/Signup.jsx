import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { API_URL } from '../../utils/constants';
import './Signup.css';

const Signup = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();

    const handleSignup = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const response = await fetch(`${API_URL}/signup`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ 
                    email: email.trim(),
                    password: password,
                    device_id: localStorage.getItem('deviceId') || crypto.randomUUID()
                })
            });

            const data = await response.json();

            if (response.status === 409) {
                setError('Email already exists. Try another.');
                return;
            }

            if (response.ok) {
                localStorage.setItem('lastEmail', email);
                navigate('/login');
            } else {
                setError(data.detail || 'Signup failed. Please try again.');
            }
        } catch (error) {
            console.error('Signup error:', error);
            setError('Connection error. Please try again.');
        }
    };

    return (
        <div className="page-wrapper">
        <div className="signup-container">
            <form className="signup-form" onSubmit={handleSignup}>
                <h2>Create an Account</h2>

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

                <button type="submit">Sign Up</button>

                {error && <p className="error-message">{error}</p>}

                <p className="signup-link">
                    Already have an account? <Link to="/login">Login</Link>
                </p>
            </form>
        </div>
    </div>
    );
};

export default Signup;