import { useState, FormEvent, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { User } from "lucide-react";

export default function RegisterCard() {
  const API_URL = import.meta.env.VITE_API_URL;

  let navigate = useNavigate();

  // Form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [username, setUsername] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [terms, setTerms] = useState(false);

  // Error states
  const [emailError, setEmailError] = useState<string[]>([]);
  const [passwordError, setPasswordError] = useState<string[]>([]);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string[]>(
    []
  );
  const [usernameError, setUsernameError] = useState<string[]>([]);
  const [firstNameError, setFirstNameError] = useState<string[]>([]);
  const [lastNameError, setLastNameError] = useState<string[]>([]);
  const [termsError, setTermsError] = useState("");
  const [serverError, setServerError] = useState("");

  // Loading states
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Better autofill handling - more aggressive styles to ensure text is always visible
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
    background-color: white !important;
    color: black !important;
  }
  
  /* Force black text on all inputs */
  input {
    color: black !important;
    background-color: white !important;
  }
  `;

  // Handle email change - clear errors when typing
  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    // Clear error messages when typing
    if (emailError.length > 0) {
      setEmailError([]);
    }
  };

  // Handle username change - clear errors when typing
  const handleUsernameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    // Clear error messages when typing
    if (usernameError.length > 0) {
      setUsernameError([]);
    }
  };

  // Check if email already exists
  async function checkEmailExists(email: string): Promise<boolean> {
    if (!email) return true;

    setIsCheckingEmail(true);
    try {
      const response = await fetch(
        `${API_URL}/auth/check-email?email=${encodeURIComponent(email)}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.exists) {
        setEmailError(["Email is already in use"]);
        return false;
      } else {
        setEmailError([]);
        return true;
      }
    } catch (error) {
      console.error("Error checking email:", error);
      // Don't add validation error on network errors
      return true;
    } finally {
      setIsCheckingEmail(false);
    }
  }

  // Check if username already exists
  async function checkUsernameExists(username: string): Promise<boolean> {
    if (!username) return true;

    setIsCheckingUsername(true);
    try {
      const response = await fetch(
        `${API_URL}/auth/check-username?username=${encodeURIComponent(
          username
        )}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
          },
        }
      );

      const data = await response.json();

      if (data.exists) {
        setUsernameError(["Username is already taken"]);
        return false;
      } else {
        setUsernameError([]);
        return true;
      }
    } catch (error) {
      console.error("Error checking username:", error);
      // Don't add validation error on network errors
      return true;
    } finally {
      setIsCheckingUsername(false);
    }
  }

  // Modified email validation function
  async function validateEmail(): Promise<boolean> {
    // Clear any previous errors first
    setEmailError([]);

    let emailErrors: string[] = [];
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email) {
      emailErrors.push("Email is required");
      setEmailError(emailErrors);
      return false;
    } else if (!regex.test(email)) {
      emailErrors.push("Please enter a valid email address");
      setEmailError(emailErrors);
      return false;
    }

    // Only check for existence if basic validation passes
    const emailAvailable = await checkEmailExists(email);
    return emailAvailable;
  }

  function validatePassword(): boolean {
    let passwordErrors: string[] = [];
    const regex = /[^a-zA-Z0-9]/;
    if (!password) {
      passwordErrors.push("Password is required");
    } else if (password.length < 8) {
      passwordErrors.push("Password must be at least 8 characters long");
    } else if (!regex.test(password)) {
      passwordErrors.push(
        "Password must include at least one special character"
      );
    }
    setPasswordError(passwordErrors);
    return passwordErrors.length === 0;
  }

  function validateConfirmPassword(): boolean {
    let errors: string[] = [];
    if (!confirmPassword) {
      errors.push("Please confirm your password");
    } else if (confirmPassword !== password) {
      errors.push("Passwords do not match");
    }
    setConfirmPasswordError(errors);
    return errors.length === 0;
  }

  // Modified username validation function
  async function validateUsername(): Promise<boolean> {
    // Clear any previous errors first
    setUsernameError([]);

    let errors: string[] = [];
    if (!username) {
      errors.push("Username is required");
      setUsernameError(errors);
      return false;
    } else if (username.length < 3) {
      errors.push("Username must be at least 3 characters long");
      setUsernameError(errors);
      return false;
    }

    // Only check for existence if basic validation passes
    const usernameAvailable = await checkUsernameExists(username);
    return usernameAvailable;
  }

  function validateFirstName(): boolean {
    let errors: string[] = [];
    if (!firstName) {
      errors.push("First name is required");
    } else if (firstName.length < 2) {
      errors.push("First name must be at least 2 characters long");
    }
    setFirstNameError(errors);
    return errors.length === 0;
  }

  function validateLastName(): boolean {
    let errors: string[] = [];
    if (!lastName) {
      errors.push("Last name is required");
    } else if (lastName.length < 2) {
      errors.push("Last name must be at least 2 characters long");
    }
    setLastNameError(errors);
    return errors.length === 0;
  }

  function validateTerms(): boolean {
    if (!terms) {
      setTermsError("You must accept the terms and conditions");
    } else {
      setTermsError("");
    }
    return terms;
  }

  async function submitRegister(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setServerError("");

    // Run all validations
    const isEmailValid = await validateEmail();
    const isUsernameValid = await validateUsername();
    const isPasswordValid = validatePassword();
    const isConfirmPasswordValid = validateConfirmPassword();
    const isFirstNameValid = validateFirstName();
    const isLastNameValid = validateLastName();
    const areTermsAccepted = validateTerms();

    if (
      isEmailValid &&
      isPasswordValid &&
      isConfirmPasswordValid &&
      isUsernameValid &&
      isFirstNameValid &&
      isLastNameValid &&
      areTermsAccepted
    ) {
      setIsSubmitting(true);
      try {
        const response = await fetch(`${API_URL}/auth/user/create`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email,
            username,
            firstname: firstName, // Make sure these match your backend field names
            lastname: lastName,
            password: password,
          }),
        });

        if (response.ok) {
          console.log("Registration successful");
          navigate("/login?registered=true"); // Add a query param to show a success message on login page
        } else {
          const data = await response.json();
          console.error("Registration failed:", data);

          // Extract specific error messages if available
          if (data.detail && typeof data.detail === "object") {
            if (data.detail.email) {
              setEmailError([data.detail.email]);
            }
            if (data.detail.username) {
              setUsernameError([data.detail.username]);
            }
            setServerError("Please correct the errors above.");
          } else {
            setServerError(
              data.detail || "Registration failed. Please try again."
            );
          }
        }
      } catch (error) {
        console.error("Error during registration:", error);
        setServerError("Network error. Please try again later.");
      } finally {
        setIsSubmitting(false);
      }
    }
  }

  return (
    <div className="flex-grow flex items-center justify-center my-10">
      <div className="w-full max-w-md card-background p-10 rounded-lg shadow-lg">
        <div className="space-y-6">
          <div className="flex justify-center mb-6">
            <h2 className="text-2xl font-medium">Create Your Account</h2>
          </div>

          {serverError && (
            <div className="text-center text-red-500 px-4 mb-4">
              {serverError}
            </div>
          )}

          <style>{autofillOverrideStyle}</style>
          <form onSubmit={submitRegister} className="space-y-4">
            {/* First Name Field */}
            <div>
              <label
                htmlFor="firstName"
                className="block text-base font-medium"
              >
                First Name
              </label>
              <input
                id="firstName"
                type="text"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                onBlur={() => validateFirstName()}
                className="mt-1 block w-full rounded-md border border-gray-300 text-black bg-white p-2"
                style={{ backgroundColor: "white", color: "black" }}
                placeholder="Enter your first name"
              />
              {firstNameError.length > 0 && (
                <div className="text-red-500 text-sm mt-1">
                  {firstNameError.map((error, index) => (
                    <p key={index}>{error}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Last Name Field */}
            <div>
              <label htmlFor="lastName" className="block text-base font-medium">
                Last Name
              </label>
              <input
                id="lastName"
                type="text"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                onBlur={() => validateLastName()}
                className="mt-1 block w-full rounded-md border border-gray-300 text-black bg-white p-2"
                style={{ backgroundColor: "white", color: "black" }}
                placeholder="Enter your last name"
              />
              {lastNameError.length > 0 && (
                <div className="text-red-500 text-sm mt-1">
                  {lastNameError.map((error, index) => (
                    <p key={index}>{error}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Username Field */}
            <div>
              <label htmlFor="username" className="block text-base font-medium">
                Username
              </label>
              <input
                id="username"
                type="text"
                value={username}
                onChange={handleUsernameChange}
                onBlur={async () => {
                  if (username && username.length >= 3) {
                    await validateUsername();
                  } else if (username) {
                    setUsernameError([
                      "Username must be at least 3 characters long",
                    ]);
                  } else {
                    setUsernameError(["Username is required"]);
                  }
                }}
                className="mt-1 block w-full rounded-md border border-gray-300 text-black bg-white p-2"
                style={{ backgroundColor: "white", color: "black" }}
                placeholder="Choose a username"
              />
              {isCheckingUsername && (
                <p className="text-blue-500 text-sm mt-1">
                  Checking username availability...
                </p>
              )}
              {usernameError.length > 0 && (
                <div className="text-red-500 text-sm mt-1">
                  {usernameError.map((error, index) => (
                    <p key={index}>{error}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Email Field */}
            <div>
              <label htmlFor="email" className="block text-base font-medium">
                Email Address
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={handleEmailChange}
                onBlur={async () => {
                  if (email) {
                    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (regex.test(email)) {
                      await validateEmail();
                    } else {
                      setEmailError(["Please enter a valid email address"]);
                    }
                  } else {
                    setEmailError(["Email is required"]);
                  }
                }}
                className="mt-1 block w-full rounded-md border border-gray-300 text-black bg-white p-2"
                style={{ backgroundColor: "white", color: "black" }}
                placeholder="Enter your email address"
              />
              {isCheckingEmail && (
                <p className="text-blue-500 text-sm mt-1">
                  Checking email availability...
                </p>
              )}
              {emailError.length > 0 && (
                <div className="text-red-500 text-sm mt-1">
                  {emailError.map((error, index) => (
                    <p key={index}>{error}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Password Field */}
            <div>
              <label htmlFor="password" className="block text-base font-medium">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (passwordError.length > 0) {
                    setPasswordError([]);
                  }
                  if (confirmPassword) {
                    // Revalidate confirm password when password changes
                    validateConfirmPassword();
                  }
                }}
                onBlur={() => validatePassword()}
                className="mt-1 block w-full rounded-md border border-gray-300 text-black bg-white p-2"
                style={{ backgroundColor: "white", color: "black" }}
                placeholder="Create a password"
              />
              {passwordError.length > 0 && (
                <div className="text-red-500 text-sm mt-1">
                  {passwordError.map((error, index) => (
                    <p key={index}>{error}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Confirm Password Field */}
            <div>
              <label
                htmlFor="confirmPassword"
                className="block text-base font-medium"
              >
                Confirm Password
              </label>
              <input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (confirmPasswordError.length > 0) {
                    setConfirmPasswordError([]);
                  }
                }}
                onBlur={() => validateConfirmPassword()}
                className="mt-1 block w-full rounded-md border border-gray-300 text-black bg-white p-2"
                style={{ backgroundColor: "white", color: "black" }}
                placeholder="Confirm your password"
              />
              {confirmPasswordError.length > 0 && (
                <div className="text-red-500 text-sm mt-1">
                  {confirmPasswordError.map((error, index) => (
                    <p key={index}>{error}</p>
                  ))}
                </div>
              )}
            </div>

            {/* Terms and Conditions */}
            <div className="flex items-start">
              <div className="flex items-center h-5">
                <input
                  id="terms"
                  name="terms"
                  type="checkbox"
                  checked={terms}
                  onChange={(e) => {
                    setTerms(e.target.checked);
                    if (e.target.checked && termsError) {
                      setTermsError("");
                    }
                  }}
                  onBlur={() => validateTerms()}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
              </div>
              <div className="ml-3 text-sm">
                <label htmlFor="terms" className="font-medium">
                  I accept the Terms and Conditions
                </label>
                {termsError && (
                  <p className="text-red-500 text-sm mt-1">{termsError}</p>
                )}
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-4">
              <button
                type="submit"
                className="w-full flex justify-center items-center text-white py-2 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium submit-button hover:cursor-pointer"
                disabled={isSubmitting}
              >
                <User size={16} className="mr-1" />
                {isSubmitting ? "Creating Account..." : "Register"}
              </button>
            </div>

            {/* Login Link */}
            <div className="text-center mt-4">
              <p>
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => navigate("/login")}
                  className="underline hover:cursor-pointer hover:text-blue-500 focus:outline-none"
                >
                  Log in
                </button>
              </p>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
