"use client";

import { useSession } from 'next-auth/react';
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

const LoadingSpinner = () => (
  <div className="flex items-center justify-center space-x-2">
    <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
    <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
    <div className="w-4 h-4 bg-blue-500 rounded-full animate-bounce"></div>
  </div>
);

const LoginIcon = () => (
  <div className="relative">
    <svg
      className="w-16 h-16 text-blue-500 mb-4 animate-pulse"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"
      />
    </svg>
    <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 rounded-full animate-ping"></div>
  </div>
);

interface RequireAuthProps {
  children: React.ReactNode;
}

const RequireAuth: React.FC<RequireAuthProps> = ({ children }) => {
  const { data: session, status } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [redirecting, setRedirecting] = useState(false);
  const [countdown, setCountdown] = useState(3);

  useEffect(() => {
    if (status === "unauthenticated") {
      setRedirecting(true);

      const countdownInterval = setInterval(() => {
        setCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(countdownInterval);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      const redirectTimer = setTimeout(() => {
        const callbackUrl = `${pathname}?${searchParams.toString()}`;
        const loginUrl = `${process.env.NEXT_PUBLIC_BASE_URL}/login?callbackUrl=${encodeURIComponent(callbackUrl)}`;
        router.replace(loginUrl);
      }, 3000);

      return () => {
        clearInterval(countdownInterval);
        clearTimeout(redirectTimer);
      };
    }
  }, [status, pathname, router, searchParams]);

  if (status === "loading") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 transform transition-all duration-500 hover:scale-105">
          <div className="text-center">
            <div className="mb-6">
              <LoadingSpinner />
            </div>
            <h2 className="text-xl font-semibold text-gray-800 mb-2">
              Đang kiểm tra đăng nhập...
            </h2>
            <p className="text-gray-600">
              Vui lòng chờ trong giây lát
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (redirecting) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 to-red-100 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl p-8 max-w-md w-full mx-4 transform transition-all duration-500 animate-fade-in">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <LoginIcon />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Yêu cầu đăng nhập
            </h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              Vui lòng đăng nhập vào VNF trước khi sử dụng link này
            </p>
            <div className="bg-orange-50 border-l-4 border-orange-400 p-4 mb-6 rounded-r-lg">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="w-5 h-5 text-orange-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd"/>
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm text-orange-700">
                    Đang chuyển hướng trong <span className="font-bold text-orange-800 text-lg">{countdown}</span> giây...
                  </p>
                </div>
              </div>
            </div>
            <div className="flex justify-center">
              <div className="w-48 bg-gray-200 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-gradient-to-r from-orange-400 to-red-500 h-full rounded-full transition-all duration-1000 ease-out"
                  style={{
                    width: `${((3 - countdown) / 3) * 100}%`,
                    transition: 'width 1s linear'
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!session) return null;

  return <>{children}</>;
};

export default RequireAuth;