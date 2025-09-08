import React, { useState } from 'react';
import { User } from '../types/weighbridge';
import { mockUsers } from '../data/mockData';
import { Scale, AlertCircle } from 'lucide-react';

interface LoginFormProps {
  onLogin: (user: User) => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    const user = mockUsers.find(
      u => u.username === username && u.password === password
    );
    
    if (user) {
      onLogin(user);
    } else {
      setError('Invalid username or password');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="bg-white rounded-xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Scale className="w-12 h-12 text-blue-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800 mb-2">JWS</h1>
          <p className="text-gray-600">Weighbridge Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Username
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter username"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="Enter password"
              required
            />
          </div>

          {error && (
            <div className="flex items-center text-red-600 text-sm">
              <AlertCircle className="w-4 h-4 mr-2" />
              {error}
            </div>
          )}

          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition-colors"
          >
            Login
          </button>
        </form>

        <div className="mt-8 p-4 bg-gray-50 rounded-lg">
          <p className="text-sm text-gray-600 mb-2">Demo Credentials:</p>
          <div className="text-xs text-gray-500 space-y-1">
            <div>Operator: username: <span className="font-mono bg-gray-200 px-1">operator</span>, password: <span className="font-mono bg-gray-200 px-1">op123</span></div>
            <div>Admin: username: <span className="font-mono bg-gray-200 px-1">admin</span>, password: <span className="font-mono bg-gray-200 px-1">admin123</span></div>
          </div>
        </div>
      </div>
    </div>
  );
};