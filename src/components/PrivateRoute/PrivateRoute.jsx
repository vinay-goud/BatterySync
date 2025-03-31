import { Navigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';

const PrivateRoute = ({ children }) => {
    const { token, email } = useAuth();
    
    if (!token || !email) {
        return <Navigate to="/login" replace />;
    }

    return children;
};

export default PrivateRoute;