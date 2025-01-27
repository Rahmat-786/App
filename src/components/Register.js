import React, { useState } from 'react';
import { auth } from '../firebase';
import { motion } from 'framer-motion';

const Register = ({ onRegisterSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);

    const handleRegister = async (e) => {
        e.preventDefault();
        setError(null);
        try {
            await auth.createUserWithEmailAndPassword(email, password);
            onRegisterSuccess();
        } catch (err) {
            setError(err.message);
        }
    };

    return (
        <motion.div
            className="login-screen"
            initial={{ opacity: 0, y: -50 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
        >
            <h2>Register for AI Doctor</h2>
            {error && <div className="error">{error}</div>}
            <form onSubmit={handleRegister}>
                <input
                    type="email"
                    className="username-input"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                 <input
                    type="password"
                    className="username-input"
                    placeholder="Password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <button type="submit">Register</button>
            </form>
        </motion.div>
    );
};

export default Register;
