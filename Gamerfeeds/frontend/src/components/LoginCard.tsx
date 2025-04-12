import { Link, useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { useState } from "react";
import { LogIn } from "lucide-react";

export default function LoginCard() {
  const { login, error: storeError, isLoading, clearError } = useAuthStore();
  const navigate = useNavigate();

  const [email, setEmail] = useState("");
  const [emailError, setEmailError] = useState("");

  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");

  function validateEmail() {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError("Email is required");
      return false;
    } else if (!regex.test(email)) {
      setEmailError("It must be a valid email");
      return false;
    } else {
      setEmailError("");
      return true;
    }
  }

  function validatePassword() {
    if (!password) {
      setPasswordError("Password is required");
      return false;
    } else {
      setPasswordError("");
      return true;
    }
  }

  async function submitLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    clearError(); // Reset any previous errors

    const isEmailValid = validateEmail();
    const isPasswordValid = validatePassword();

    if (isEmailValid && isPasswordValid) {
      try {
        // Use the login method from authStore
        await login(email, password);

        // If login was successful (no error thrown), navigate to home
        if (!storeError) {
          navigate("/");
        }
      } catch (error) {
        // Error handling is done by the store
        console.error("Login failed", error);
      }
    } else {
      console.log("Validation errors");
    }
  }

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

  return (
    <div className="w-full max-w-md card-background p-10 rounded-lg shadow-lg">
      {storeError && (
        <div className="text-red-500 px-4 mb-3 text-center">{storeError}</div>
      )}

      <style>{autofillOverrideStyle}</style>
      <form onSubmit={submitLogin} className="space-y-6">
        <div>
          <label htmlFor="email" className="block text-base font-medium">
            Email Address
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onBlur={validateEmail}
            className={inputStyle}
            placeholder="Enter your email address"
            style={{ backgroundColor: "white" }}
            disabled={isLoading}
          />
          {emailError && (
            <p className="text-red-500 text-sm mt-1">{emailError}</p>
          )}
        </div>

        <div>
          <label htmlFor="password" className="block text-base font-medium">
            Password
          </label>
          <input
            id="password"
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            onBlur={validatePassword}
            className={inputStyle}
            placeholder="Enter your password"
            style={{ backgroundColor: "white" }}
            disabled={isLoading}
          />
          {passwordError && (
            <p className="text-red-500 text-sm mt-1">{passwordError}</p>
          )}
        </div>

        <div>
          <button
            type="submit"
            className="w-full flex items-center gap-2 text-white justify-center py-2 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium submit-button hover:cursor-pointer disabled:opacity-70 disabled:cursor-not-allowed"
            disabled={isLoading}
          >
            <LogIn size={16} />
            {isLoading ? "Logging in..." : "Login"}
          </button>
        </div>
      </form>
      <div className="flex justify-between text-sm mt-5 underline">
        <Link to="/login/register" className="hover:text-blue-500">
          Register?
        </Link>
        <Link to="/login/forget-password" className="hover:text-blue-500">
          Forgot password?
        </Link>
      </div>
    </div>
  );
}
