import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, ArrowLeft } from "lucide-react";
import { BASE_URL } from "../../api/base";
import { useUserStore } from "../../store/useUserStore";

const SignUp = () => {
  const navigate = useNavigate();
  const { setToken, fetchProfile } = useUserStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!name.trim()) return setError("Please enter your name");
    if (!validateEmail(email)) return setError("Please enter a valid email address");
    if (!phoneNumber.trim() || phoneNumber.length < 10)
      return setError("Please enter a valid phone number");
    if (!password.trim() || password.length < 6)
      return setError("Password must be at least 6 characters");
    if (password !== confirmPassword) return setError("Passwords do not match");

    setLoading(true);

    try {
      // REGISTER
      const res = await fetch(`${BASE_URL}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phoneNumber, password, amount: 5000 }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Sign up failed");

      // AUTO LOGIN
      const loginRes = await fetch(`${BASE_URL}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const loginData = await loginRes.json();
      if (!loginRes.ok) throw new Error(loginData.message || "Login after sign up failed");

      setToken(loginData.token);
      await fetchProfile();
      navigate("/dashboard", { replace: true });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const passwordsMatch = password && confirmPassword && password === confirmPassword;

  return (
    <div className="min-h-screen flex flex-col md:grid md:grid-cols-2 bg-orange-50">
      {/* LEFT SIDE - FORM */}
      <div className="flex flex-col justify-center items-center px-6 py-10 w-full">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="flex items-center gap-2 text-orange-600 mb-6 p-2 rounded-full border border-orange-200 hover:bg-orange-100 transition md:hidden self-start"
        >
          <ArrowLeft size={20} /> Back
        </button>

        <div className="w-full max-w-md bg-white rounded-2xl shadow-lg p-8 md:p-10">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 text-center md:text-left">
            Create Your Account
          </h1>
          <p className="text-gray-500 mb-8 text-sm sm:text-base text-center md:text-left">
            Fill in the details below to sign up
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Name */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Name</label>
              <input
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full mt-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm sm:text-base"
              />
            </div>

            {/* Email */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Email</label>
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full mt-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm sm:text-base"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Phone Number</label>
              <input
                type="tel"
                placeholder="Enter your phone number"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                required
                className="w-full mt-1 px-4 py-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm sm:text-base"
              />
            </div>

            {/* Password */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Password</label>
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

            {/* Confirm Password */}
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1 block">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="w-full mt-1 px-4 py-3 rounded-lg border border-gray-300 pr-10 focus:ring-2 focus:ring-orange-500 focus:outline-none text-sm sm:text-base"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400"
                >
                  {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
              {confirmPassword && (
                <p
                  className={`mt-1 text-sm ${
                    passwordsMatch ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {passwordsMatch ? "Passwords match ✅" : "Passwords do not match ❌"}
                </p>
              )}
            </div>

            {/* Error Message */}
            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-2 rounded text-center">
                {error}
              </div>
            )}

            {/* Sign Up Button */}
            <button
              type="submit"
              disabled={loading || !passwordsMatch}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-medium transition disabled:opacity-60"
            >
              {loading ? "Creating Account..." : "Sign Up"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-gray-600">
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-orange-600 hover:underline"
            >
              Sign in
            </button>
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - Illustration */}
      <div className="hidden md:flex items-center justify-center relative">
        <img
          src="https://imgs.search.brave.com/eO8vuypxulK6Oi6Z1lF05KQR4sfhlkIHq98s_Di8Nz4/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvMTQ2/ODM5Njc2Ni9waG90/by9zdXN0YWluYmxl/LWdyZWVuLWJ1aWxk/aW5nLWVjby1mcmll/bmRseS1idWlsZGlu/Zy1zdXN0YWluYWJs/ZS1nbGFzcy1vZmZp/Y2UtYnVpbGRpbmct/d2l0aC10cmVlLmpw/Zz9zPTYxMng2MTIm/dz0wJms9MjAmYz1m/eDJTUVF4UG1LWTZv/VXBSLVpjSkVCNUsz/ZFlKSXBTRndWQzBz/TTJGSVcwPQ"
          alt="Sign Up Illustration"
          className="w-full object-cover h-full rounded-l-3xl"
        />
      </div>
    </div>
  );
};

export default SignUp;
