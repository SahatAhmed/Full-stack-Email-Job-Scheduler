'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore, type AuthUser } from '@/lib/authStore';
import { Mail, ArrowRight } from 'lucide-react';
import { FcGoogle } from "react-icons/fc";

export default function LoginPage() {
  const router = useRouter();
  const { user, login } = useAuthStore();

  useEffect(() => {
    if (user) {
      router.push('/dashboard');
    }
  }, [user, router]);

  const handleGoogleLogin = () => {
    // Simulate Google OAuth login
    // In production, you'd use Next.js auth library or Google OAuth flow
    const mockUser: AuthUser = {
      userId: 'user-' + Math.random().toString(36).substring(7),
      email: 'user@example.com',
      name: 'Test User',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=test',
    };

    login(mockUser);
    router.push('/dashboard');
  };

  const handleDemoLogin = () => {
    const mockUser: AuthUser = {
      userId: 'demo-user-' + Date.now(),
      email: `demo-${Date.now()}@example.com`,
      name: 'Demo User',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
    };

    login(mockUser);
    router.push('/dashboard');
  };

  return (
  <div className="min-h-screen flex items-center justify-center bg-white">
      <div className="w-full max-w-xl px-6">
        {/* Card */}
        <div className="bg-white border border-gray-200 rounded-2xl p-8 shadow-sm">
          {/* Title */}
          <h1 className="text-4xl font-semibold text-center text-gray-900 mb-8">
            Login
          </h1>

          {/* Google Button */}
          <button
          onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 py-3 rounded-xl text-xl
                       bg-green-100 hover:bg-green-200 transition-colors cursor-pointer
                       text-gray-800 font-normal"
          >
            <FcGoogle className="w-5 h-5" />
            Login with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-4 my-6">
            <div className="flex-1 h-px bg-gray-200" />
            <span className="text-sm text-gray-400">
              or sign up through email
            </span>
            <div className="flex-1 h-px bg-gray-200" />
          </div>

          {/* Email */}
          <input
            type="email"
            placeholder="Email ID"
            className="w-full mb-4 px-4 py-3 rounded-xl
                       bg-green-50 border border-gray-200
                       text-gray-800 placeholder-gray-400
                       focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          {/* Password */}
          <input
            type="password"
            placeholder="Password"
            className="w-full mb-6 px-4 py-3 rounded-xl
                       bg-green-50 border border-gray-200
                       text-gray-800 placeholder-gray-400
                       focus:outline-none focus:ring-2 focus:ring-green-500"
          />

          {/* Login Button */}
          <button
          onClick={handleDemoLogin}
            className="w-full py-3 rounded-xl bg-green-600
                       hover:bg-green-700 transition-colors
                       text-white font-normal cursor-pointer"
          >
            Login
          </button>
        </div>
      </div>
    </div>  
  );
}
