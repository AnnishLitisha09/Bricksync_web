import { Navigate, Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import { useUserStore } from "../store/useUserStore";

const ProtectedRoute = () => {
  const { token, user, fetchProfile, loading } = useUserStore();
  const [progress, setProgress] = useState(0);

  // Smooth progress simulation
  useEffect(() => {
    if (loading || !user) {
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 95) return prev;
          // Random increments for a more realistic feel
          return prev + Math.floor(Math.random() * 10) + 1;
        });
      }, 150);
      return () => clearInterval(interval);
    }
  }, [loading, user]);

  useEffect(() => {
    if (token && !user) {
      fetchProfile();
    }
  }, [token, user, fetchProfile]);

  if (!token) {
    return <Navigate to="/landing" replace />;
  }

  if (loading || !user) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-100 p-6 text-center">
        <div className="w-full max-w-sm">
          {/* Header Branding */}
          <div className="mb-12 space-y-2">
            <h2 className="text-gray-500 uppercase tracking-[0.2em] text-xs font-bold">Welcome to</h2>
            <h1 className="text-3xl font-black text-slate-900 leading-none">
              ASWATH <br />
              <span className="text-orange-600">HOLLOW BRICKS</span>
            </h1>
            <p className="text-slate-500 font-medium text-sm">& Lorry Services</p>
          </div>

          {/* Animated Progress Section */}
          <div className="relative w-full px-2">
            
            {/* The Moving Truck Icon */}
            <div 
              className="absolute -top-8 transition-all duration-300 ease-out"
              style={{ left: `calc(${progress}% - 20px)` }}
            >
              <div className="bg-orange-600 p-2 rounded-lg shadow-lg">
                <svg 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  stroke="white" 
                  strokeWidth="2" 
                  className="w-6 h-6"
                >
                  <path d="M10 17h4V5H2v12h3m10 0h2l3-3v-4h-5v7zm-2-7h5m-15 7a3 3 0 1 0 6 0 3 3 0 0 0-6 0zm11 0a3 3 0 1 0 6 0 3 3 0 0 0-6 0z" />
                </svg>
              </div>
              {/* Exhaust smoke effect */}
              <div className="absolute -left-2 top-4 flex space-x-1 opacity-60">
                <div className="w-1 h-1 bg-gray-400 rounded-full animate-ping"></div>
              </div>
            </div>

            {/* Progress Track */}
            <div className="h-4 w-full bg-white rounded-full overflow-hidden shadow-inner border border-gray-200">
              <div 
                className="h-full bg-gradient-to-r from-orange-400 to-orange-600 transition-all duration-300 ease-out flex items-center justify-end"
                style={{ width: `${progress}%` }}
              >
                {/* Subtle shine on the bar */}
                <div className="w-full h-full animate-pulse bg-white/10"></div>
              </div>
            </div>

            {/* Status Labels */}
            <div className="flex justify-between mt-3 text-[10px] font-bold text-slate-400 uppercase tracking-widest">
              <span>Loading Goods</span>
              <span className="text-orange-600">{progress}%</span>
              <span>Delivering</span>
            </div>
          </div>

          <p className="mt-12 text-slate-400 text-xs font-medium animate-pulse uppercase tracking-tighter">
            Starting engines... Please wait
          </p>
        </div>
      </div>
    );
  }

  return <Outlet />;
};

const PublicRoute = () => {
  const { token } = useUserStore();
  if (token) return <Navigate to="/dashboard" replace />;
  return <Outlet />;
};

export { PublicRoute, ProtectedRoute };