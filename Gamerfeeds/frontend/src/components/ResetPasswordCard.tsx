import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Lock, ArrowLeft } from "lucide-react";

export default function ResetPasswordCard() {
  const API_URL = import.meta.env.VITE_API_URL;
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Style to handle both normal state and browser autofill
  const inputStyle =
    "mt-1 block w-full rounded-md border border-gray-300 text-black bg-white p-2 focus:bg-white active:bg-white hover:bg-white";

  // CSS to override browser autofill styles
  const autofillOverrideStyle = `
  input:-webkit-autofill,
  input:-webkit-autofill:hover,
  input:-webkit-autofill:focus,
  input:-webkit-autofill:active {
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: black !important;
    transition: background-color 5000s ease-in-out 0s !important;
    box-shadow: inset 0 0 20px 20px white !important;
    caret-color: black !important;
  }
`;

  useEffect(() => {
    if (!token) {
      setServerError("Invalid password reset link. Please request a new one.");
    }
  }, [token]);

  const validatePassword = () => {
    if (!password) {
      setPasswordError("Password is required");
      return false;
    } else if (password.length < 8) {
      setPasswordError("Password must be at least 8 characters long");
      return false;
    } else {
      setPasswordError("");
      return true;
    }
  };

  const validateConfirmPassword = () => {
    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your password");
      return false;
    } else if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      return false;
    } else {
      setConfirmPasswordError("");
      return true;
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(""); // Reset server error
    setSuccess(""); // Reset success message

    // Validate inputs before proceeding
    const isPasswordValid = validatePassword();
    const isConfirmPasswordValid = validateConfirmPassword();

    if (!isPasswordValid || !isConfirmPasswordValid || !token) {
      return; // Prevent form submission if validation fails
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/auth/password-reset/confirm`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ token, new_password: password }),
      });

      if (response.ok) {
        setSuccess("Your password has been reset successfully.");
        // Clear form fields
        setPassword("");
        setConfirmPassword("");

        // Redirect to login page after a delay
        setTimeout(() => {
          navigate("/login");
        }, 3000);
      } else {
        const errorData = await response.json();
        setServerError(
          errorData.detail ||
            "Failed to reset password. The link may have expired or already been used."
        );
      }
    } catch (error) {
      console.error("There was an error!", error);
      setServerError("An unexpected error occurred. Please try again later.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center my-10">
      <div className="w-full max-w-md card-background p-10 rounded-lg shadow-lg">
        <div className="space-y-6">
          <div className="flex justify-center mb-6">
            <h2 className="text-2xl font-medium">Reset Your Password</h2>
          </div>

          {/* Success Message */}
          {success && (
            <div
              className="text-center text-green-500 px-4 relative"
              role="alert"
            >
              <span className="block sm:inline">{success}</span>
              <p className="mt-2 text-sm">Redirecting to login page...</p>
            </div>
          )}

          {/* Error Message */}
          {serverError && (
            <div
              className="text-center text-red-500 px-4 py-3 rounded relative"
              role="alert"
            >
              <span className="block sm:inline">{serverError}</span>
              {!token && (
                <div className="mt-4">
                  <button
                    onClick={() => navigate("/forgot-password")}
                    className="mx-auto flex items-center text-white py-2 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium submit-button hover:cursor-pointer"
                  >
                    <ArrowLeft size={16} className="mr-1" />
                    Request a new password reset
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Only show the form if no success message and token exists */}
          {!success && token && (
            <>
              <style>{autofillOverrideStyle}</style>
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* New Password Field */}
                <div>
                  <label
                    htmlFor="password"
                    className="block text-base font-medium"
                  >
                    New Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (confirmPassword) validateConfirmPassword();
                    }}
                    onBlur={validatePassword}
                    className={inputStyle}
                    style={{
                      backgroundColor: "white",
                      color: "black",
                      WebkitTextFillColor: "black",
                    }}
                    placeholder="Enter your new password"
                    autoComplete="new-password"
                  />
                  {passwordError && (
                    <p className="text-red-500 text-sm mt-1">{passwordError}</p>
                  )}
                </div>

                {/* Confirm Password Field */}
                <div>
                  <label
                    htmlFor="confirmPassword"
                    className="block text-base font-medium"
                  >
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    onBlur={validateConfirmPassword}
                    className={inputStyle}
                    style={{
                      backgroundColor: "white",
                      color: "black",
                      WebkitTextFillColor: "black",
                    }}
                    placeholder="Confirm your new password"
                    autoComplete="new-password"
                  />
                  {confirmPasswordError && (
                    <p className="text-red-500 text-sm mt-1">
                      {confirmPasswordError}
                    </p>
                  )}
                </div>

                {/* Submit Button */}
                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full flex justify-center items-center text-white py-2 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium submit-button hover:cursor-pointer"
                    disabled={isSubmitting}
                  >
                    <Lock size={16} className="mr-1" />
                    {isSubmitting ? "Resetting Password..." : "Reset Password"}
                  </button>
                </div>

                {/* Back to Login */}
                <div className="text-center mt-4">
                  <button
                    type="button"
                    onClick={() => navigate("/login")}
                    className="mx-auto flex items-center text-white py-2 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium submit-button hover:cursor-pointer"
                  >
                    <ArrowLeft size={16} className="mr-1" />
                    Back to Login
                  </button>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
