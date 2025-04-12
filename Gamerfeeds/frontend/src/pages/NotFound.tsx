import { Home } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen text-center px-4">
      <div className="max-w-4xl mx-auto w-full card-background p-10 rounded-lg">
        <h1 className="text-6xl font-[Black_Ops_One] mb-6 div-header">404</h1>
        <h2 className="text-3xl font-semibold mb-4">Page Not Found</h2>

        <div className="mb-8 text-center text-yellow-500">
          <p>
            Oops! The page you are looking for doesn't exist or has been moved.
          </p>
        </div>

        <p className="text-lg mb-8">
          It seems you've ventured into uncharted territory. Let's get you back
          on track.
        </p>

        <Link
          to="/"
          className="inline-flex items-center px-6 py-3 submit-button text-white rounded-lg hover:cursor-pointer"
        >
          <Home size={18} className="mr-2" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
