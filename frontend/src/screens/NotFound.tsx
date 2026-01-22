import { useNavigate } from "react-router-dom";

export default function NotFound() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-4">
      <h1 className="text-6xl font-bold text-gray-800">404</h1>
      <p className="mt-4 text-xl text-gray-600">
        Oops! Page not found
      </p>
      <p className="mt-2 text-sm text-gray-500">
        The page you are looking for doesn’t exist.
      </p>

      <button
        onClick={() => navigate("/dashboard")}
        className="mt-6 bg-green-700 text-white px-6 py-2 rounded-md hover:bg-green-800 transition"
      >
        Go to Dashboard
      </button>
    </div>
  );
}