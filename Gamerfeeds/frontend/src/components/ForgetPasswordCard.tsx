import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Mail, ArrowLeft } from "lucide-react";

export default function ForgetPasswordCard() {
  const API_URL = import.meta.env.VITE_API_URL;
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");
  const [serverError, setServerError] = useState("");
  const [success, setSuccess] = useState(false);
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

  const validateEmail = () => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError("Email is required");
      return false;
    } else if (!regex.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    } else {
      setEmailError("");
      return true;
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(""); // Reset server error

    // Validate email before proceeding
    if (!validateEmail()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/auth/password-reset/request`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        setSuccess(true);
        // Clear email field
        setEmail("");
      } else {
        const errorData = await response.json();
        setServerError(
          errorData.detail || "An error occurred. Please try again later."
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
          <div className="flex justify-center mb-3">
            <h2 className="text-2xl font-medium">Forgot Password</h2>
          </div>

          {/* Success Message */}
          {success ? (
            <div
              className="text-center text-green-500 px-4 rounded relative"
              role="alert"
            >
              <span className="block sm:inline">
                If the email address you entered is associated with an account,
                you will receive an email with instructions to reset your
                password.
              </span>
              <div className="mt-4">
                <button
                  onClick={() => navigate("/login")}
                  className="mx-auto flex items-center text-white py-2 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium submit-button hover:cursor-pointer"
                >
                  <ArrowLeft size={16} className="mr-1" />
                  Back to Login
                </button>
              </div>
            </div>
          ) : (
            <>
              {serverError && (
                <div className="text-center text-red-500 px-4 mb-4">
                  {serverError}
                </div>
              )}

              <p className="text-gray-600 mb-4">
                Enter the email address associated with your account, and we'll
                send you a link to reset your password.
              </p>

              <style>{autofillOverrideStyle}</style>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-base font-medium"
                  >
                    Email Address
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={validateEmail}
                    className={inputStyle}
                    style={{
                      backgroundColor: "white",
                      color: "black",
                      WebkitTextFillColor: "black",
                    }}
                    placeholder="Enter your email address"
                  />
                  {emailError && (
                    <p className="text-red-500 text-sm mt-1">{emailError}</p>
                  )}
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full flex justify-center items-center text-white py-2 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium submit-button hover:cursor-pointer"
                    disabled={isSubmitting}
                  >
                    <Mail size={16} className="mr-1" />
                    {isSubmitting ? "Sending..." : "Send Reset Link"}
                  </button>
                </div>

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
