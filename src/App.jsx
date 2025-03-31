import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import LoadingSpinner from './components/LoadingSpinner/LoadingSpinner';
import PrivateRoute from './components/PrivateRoute/PrivateRoute';
import Home from './pages/Home/Home';
import Login from './pages/Login/Login';
import Signup from './pages/Signup/Signup';
import useBatteryStore from './store/batteryStore';
import './App.css';
import './styles/styles.css';
import './styles/notifications.css';

function App() {
    const loading = useBatteryStore(state => state.loading);

    return (
        <ErrorBoundary>
            <Router>
                {loading ? (
                    <div className="loading-container">
                        <LoadingSpinner size="large" />
                    </div>
                ) : (
                    <Routes>
                        <Route path="/login" element={<Login />} />
                        <Route path="/signup" element={<Signup />} />
                        <Route
                            path="/"
                            element={
                                <PrivateRoute>
                                    <Home />
                                </PrivateRoute>
                            }
                        />
                        <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                )}
            </Router>
        </ErrorBoundary>
    );
}

export default App;