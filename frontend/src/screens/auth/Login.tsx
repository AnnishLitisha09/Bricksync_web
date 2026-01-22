import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";

import { useUserStore } from "../../store/useUserStore";
import { BASE_URL } from "../../api/base";

const Login = () => {
  const navigate = useNavigate();
  const { setToken } = useUserStore();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const validateEmail = (email: string) => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthError(null);

    if (!validateEmail(email)) {
      setAuthError("Please enter a valid email address");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Login failed");

      setToken(data.token);
      await useUserStore.getState().fetchProfile();
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setAuthError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:grid md:grid-cols-2 bg-orange-50">
      {/* LEFT SIDE - FORM */}
      <div className="flex flex-col justify-center items-center px-6 py-10 w-full">
        {/* Back Arrow (mobile only) */}
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-orange-600 mb-6 p-2 rounded-full border border-orange-200 hover:bg-orange-100 transition md:hidden self-start"
        >
          <ArrowLeft size={20} /> Back
        </button>

        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 md:p-10">
          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 text-center md:text-left">
            Aswath Hollow Bricks & Lorry Services
          </h1>
          <p className="text-gray-500 mb-8 text-sm sm:text-base text-center md:text-left">
            Please enter your details to sign in
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Email address
              </label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full mt-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm sm:text-base"
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full mt-1 px-4 py-3 rounded-lg border border-gray-300 pr-10 focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm sm:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            {/* Remember + Forgot */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between text-sm gap-2 sm:gap-0">
              <label className="flex items-center gap-2 text-gray-600">
                <input type="checkbox" className="rounded border-gray-300" />
                Remember for 30 days
              </label>
              <button
                type="button"
                className="text-orange-600 hover:underline self-start sm:self-auto"
                onClick={() => navigate("/forgot-password")}
              >
                Forgot password
              </button>

            </div>

            {/* Error */}
            {authError && (
              <div className="bg-red-50 text-red-700 px-4 py-2 rounded text-center">
                {authError}
              </div>
            )}

            {/* Sign in */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-medium transition disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in"}
            </button>
          </form>

          {/* Don't have account */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/signup")}
              className="text-orange-600 hover:underline"
            >
              Sign up
            </button>
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - ILLUSTRATION */}
      <div className="hidden md:flex items-center justify-center  relative">
        <img
          src="https://imgs.search.brave.com/eO8vuypxulK6Oi6Z1lF05KQR4sfhlkIHq98s_Di8Nz4/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvMTQ2/ODM5Njc2Ni9waG90/by9zdXN0YWluYmxl/LWdyZWVuLWJ1aWxk/aW5nLWVjby1mcmll/bmRseS1idWlsZGlu/Zy1zdXN0YWluYWJs/ZS1nbGFzcy1vZmZp/Y2UtYnVpbGRpbmct/d2l0aC10cmVlLmpw/Zz9zPTYxMng2MTIm/dz0wJms9MjAmYz1m/eDJTUVF4UG1LWTZv/VXBSLVpjSkVCNUsz/ZFlKSXBTRndWQzBz/TTJGSVcwPQ"
          alt="Login Illustration"
          className="w-full object-cover h-full rounded-l-3xl"
        />
      </div>
    </div>
  );
};

export default Login;
