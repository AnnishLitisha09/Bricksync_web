import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { BASE_URL } from "../../api/base";

const ForgotPassword = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!email.trim()) return setError("Please enter your email");

    setLoading(true);

    try {
      const res = await fetch(`${BASE_URL}/auth/forgot-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Failed to send reset email");

      setSuccessMessage("Reset link sent! Please check your email.");
    } catch (err: any) {
      setError(err.message);
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
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-2 text-center md:text-left">
            Forgot Password
          </h1>
          <p className="text-gray-500 mb-8 text-sm sm:text-base text-center md:text-left">
            Enter your email address and we’ll send you a link to reset your password.
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

            {/* Error */}
            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-2 rounded text-center">
                {error}
              </div>
            )}

            {/* Success */}
            {successMessage && (
              <div className="bg-green-50 text-green-700 px-4 py-2 rounded text-center">
                {successMessage}
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 rounded-lg font-medium transition disabled:opacity-60"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
          </form>

          {/* Back to login */}
          <p className="mt-6 text-center text-sm text-gray-600">
            Remembered your password?{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-orange-600 hover:underline"
            >
              Login
            </button>
          </p>
        </div>
      </div>

      {/* RIGHT SIDE - ILLUSTRATION */}
      <div className="hidden md:flex items-center justify-center relative">
        <img
          src="https://imgs.search.brave.com/eO8vuypxulK6Oi6Z1lF05KQR4sfhlkIHq98s_Di8Nz4/rs:fit:860:0:0:0/g:ce/aHR0cHM6Ly9tZWRp/YS5pc3RvY2twaG90/by5jb20vaWQvMTQ2/ODM5Njc2Ni9waG90/by9zdXN0YWluYmxl/LWdyZWVuLWJ1aWxk/aW5nLWVjby1mcmll/bmRseS1idWlsZGlu/Zy1zdXN0YWluYWJs/ZS1nbGFzcy1vZmZp/Y2UtYnVpbGRpbmct/d2l0aC10cmVlLmpw/Zz9zPTYxMng2MTIm/dz0wJms9MjAmYz1m/eDJTUVF4UG1LWTZv/VXBSLVpjSkVCNUsz/ZFlKSXBTRndWQzBz/TTJGSVcwPQ"
          alt="Forgot Password Illustration"
          className="w-full object-cover h-full rounded-l-3xl"
        />
      </div>
    </div>
  );
};

export default ForgotPassword;
