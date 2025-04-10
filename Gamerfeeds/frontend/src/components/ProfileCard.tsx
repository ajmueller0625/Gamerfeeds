import { useState, useEffect, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";
import { User, Save } from "lucide-react";

export default function ProfileCard() {
  const API_URL = import.meta.env.VITE_API_URL;
  const { token, userData, fetchUser } = useAuthStore();
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);

  // Form states
  const [firstname, setFirstname] = useState("");
  const [lastname, setLastname] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");

  // Original values (for checking if changed)
  const [originalUsername, setOriginalUsername] = useState("");
  const [originalEmail, setOriginalEmail] = useState("");

  // Error states
  const [firstnameError, setFirstnameError] = useState("");
  const [lastnameError, setLastnameError] = useState("");
  const [usernameError, setUsernameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Checking states
  const [isCheckingEmail, setIsCheckingEmail] = useState(false);
  const [isCheckingUsername, setIsCheckingUsername] = useState(false);

  // Initialize form with user data
  useEffect(() => {
    if (userData) {
      setFirstname(userData.firstname || "");
      setLastname(userData.lastname || "");
      setUsername(userData.username || "");
      setEmail(userData.email || "");

      // Store original values for comparison
      setOriginalUsername(userData.username || "");
      setOriginalEmail(userData.email || "");
    }
  }, [userData]);

  useEffect(() => {
    // If not logged in, redirect to login
    if (!token) {
      navigate("/login");
      return;
    }

    // Fetch fresh user data
    const loadUserData = async () => {
      setIsLoading(true);
      await fetchUser();
      setIsLoading(false);
    };

    loadUserData();
  }, [token, navigate, fetchUser]);

  // Reset all messages when toggling edit mode
  useEffect(() => {
    if (!isEditing) {
      setFirstnameError("");
      setLastnameError("");
      setUsernameError("");
      setEmailError("");
      setServerError("");
      setSuccessMessage("");
    }
  }, [isEditing]);

  // Handle email changes - clear errors when typing
  const handleEmailChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newEmail = e.target.value;
    setEmail(newEmail);
    if (emailError) {
      setEmailError("");
    }
  };

  // Handle username changes - clear errors when typing
  const handleUsernameChange = (e: ChangeEvent<HTMLInputElement>) => {
    const newUsername = e.target.value;
    setUsername(newUsername);
    if (usernameError) {
      setUsernameError("");
    }
  };

  // Check if email is already taken
  const checkEmailExists = async (email: string): Promise<boolean> => {
    // Skip check if email hasn't changed
    if (email === originalEmail) return false;

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
        setEmailError("Email is already in use by another account");
        return true;
      } else {
        setEmailError("");
        return false;
      }
    } catch (error) {
      console.error("Error checking email:", error);
      return false;
    } finally {
      setIsCheckingEmail(false);
    }
  };

  // Check if username is already taken
  const checkUsernameExists = async (username: string): Promise<boolean> => {
    // Skip check if username hasn't changed
    if (username === originalUsername) return false;

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
        setUsernameError("Username is already taken");
        return true;
      } else {
        setUsernameError("");
        return false;
      }
    } catch (error) {
      console.error("Error checking username:", error);
      return false;
    } finally {
      setIsCheckingUsername(false);
    }
  };

  const validateEmail = async () => {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email) {
      setEmailError("Email is required");
      return false;
    } else if (!regex.test(email)) {
      setEmailError("Please enter a valid email address");
      return false;
    } else {
      // Check if email is taken (only if it changed)
      if (email !== originalEmail) {
        const emailExists = await checkEmailExists(email);
        if (emailExists) return false;
      }

      setEmailError("");
      return true;
    }
  };

  const validateUsername = async () => {
    if (!username) {
      setUsernameError("Username is required");
      return false;
    } else if (username.length < 3) {
      setUsernameError("Username must be at least 3 characters long");
      return false;
    } else {
      // Check if username is taken (only if it changed)
      if (username !== originalUsername) {
        const usernameExists = await checkUsernameExists(username);
        if (usernameExists) return false;
      }

      setUsernameError("");
      return true;
    }
  };

  const validateForm = async () => {
    // First and last name can be optional, but validate them if entered
    if (firstname && firstname.length < 2) {
      setFirstnameError("First name must be at least 2 characters long");
      return false;
    } else {
      setFirstnameError("");
    }

    if (lastname && lastname.length < 2) {
      setLastnameError("Last name must be at least 2 characters long");
      return false;
    } else {
      setLastnameError("");
    }

    const isUsernameValid = await validateUsername();
    const isEmailValid = await validateEmail();

    return isUsernameValid && isEmailValid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Reset messages
    setServerError("");
    setSuccessMessage("");

    if (!(await validateForm())) {
      return;
    }

    setIsSubmitting(true);

    // Prepare data for update
    const updateData = {
      firstname,
      lastname,
      username,
      email,
    };

    try {
      const response = await fetch(`${API_URL}/general/profile`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(updateData),
      });

      if (response.ok) {
        setSuccessMessage("Profile updated successfully!");
        // Refresh user data
        await fetchUser();

        // Exit edit mode after a short delay
        setTimeout(() => {
          setIsEditing(false);
          setSuccessMessage("");
        }, 2000);
      } else {
        const data = await response.json();

        // Handle specific error messages if available
        if (data.detail && typeof data.detail === "object") {
          if (data.detail.email) {
            setEmailError(data.detail.email);
          }
          if (data.detail.username) {
            setUsernameError(data.detail.username);
          }
          setServerError("Please correct the errors above.");
        } else {
          setServerError(data.detail || "Failed to update profile");
        }
      }
    } catch (error) {
      setServerError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const cancelEdit = () => {
    // Reset form fields to current user data
    if (userData) {
      setFirstname(userData.firstname || "");
      setLastname(userData.lastname || "");
      setUsername(userData.username || "");
      setEmail(userData.email || "");
    }

    // Clear any errors
    setFirstnameError("");
    setLastnameError("");
    setUsernameError("");
    setEmailError("");
    setServerError("");

    // Exit edit mode
    setIsEditing(false);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-12 min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 spinner-color"></div>
      </div>
    );
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
    <div className="flex-grow flex items-center justify-center my-10">
      <div className="w-full max-w-md card-background p-10 rounded-lg shadow-lg">
        <div className="space-y-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-2xl font-medium">
              {isEditing ? "Edit Profile" : "User Information"}
            </h2>
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="py-1 px-3 text-white rounded-lg text-sm font-medium submit-button hover:cursor-pointer flex items-center"
              >
                <User size={16} className="mr-1" />
                Edit
              </button>
            )}
          </div>

          {successMessage && (
            <div className="text-center text-green-500 px-4 mb-4">
              {successMessage}
            </div>
          )}

          {serverError && (
            <div className="text-center text-red-500 px-4 mb-4">
              {serverError}
            </div>
          )}

          {isEditing ? (
            // Edit Mode - Show Form
            <>
              <style>{autofillOverrideStyle}</style>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="firstname"
                    className="block text-base font-medium"
                  >
                    First Name
                  </label>
                  <input
                    id="firstname"
                    type="text"
                    value={firstname}
                    onChange={(e) => setFirstname(e.target.value)}
                    onBlur={() => {
                      if (firstname && firstname.length < 2) {
                        setFirstnameError(
                          "First name must be at least 2 characters long"
                        );
                      } else {
                        setFirstnameError("");
                      }
                    }}
                    className={inputStyle}
                    style={{ backgroundColor: "white", color: "black" }}
                    placeholder="Enter your first name"
                  />
                  {firstnameError && (
                    <p className="text-red-500 text-sm mt-1">
                      {firstnameError}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="lastname"
                    className="block text-base font-medium"
                  >
                    Last Name
                  </label>
                  <input
                    id="lastname"
                    type="text"
                    value={lastname}
                    onChange={(e) => setLastname(e.target.value)}
                    onBlur={() => {
                      if (lastname && lastname.length < 2) {
                        setLastnameError(
                          "Last name must be at least 2 characters long"
                        );
                      } else {
                        setLastnameError("");
                      }
                    }}
                    className={inputStyle}
                    style={{ backgroundColor: "white", color: "black" }}
                    placeholder="Enter your last name"
                  />
                  {lastnameError && (
                    <p className="text-red-500 text-sm mt-1">{lastnameError}</p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="username"
                    className="block text-base font-medium"
                  >
                    Username
                  </label>
                  <input
                    id="username"
                    type="text"
                    value={username}
                    onChange={handleUsernameChange}
                    onBlur={async () => {
                      if (username && username.length >= 3) {
                        if (username !== originalUsername) {
                          await checkUsernameExists(username);
                        }
                      } else {
                        await validateUsername();
                      }
                    }}
                    className={inputStyle}
                    style={{ backgroundColor: "white", color: "black" }}
                    placeholder="Enter your username"
                  />
                  {isCheckingUsername && (
                    <p className="text-blue-500 text-sm mt-1">
                      Checking username availability...
                    </p>
                  )}
                  {usernameError && (
                    <p className="text-red-500 text-sm mt-1">{usernameError}</p>
                  )}
                </div>

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
                    onChange={handleEmailChange}
                    onBlur={async () => {
                      const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                      if (email && regex.test(email)) {
                        if (email !== originalEmail) {
                          await checkEmailExists(email);
                        }
                      } else {
                        await validateEmail();
                      }
                    }}
                    className={inputStyle}
                    style={{ backgroundColor: "white", color: "black" }}
                    placeholder="Enter your email address"
                  />
                  {isCheckingEmail && (
                    <p className="text-blue-500 text-sm mt-1">
                      Checking email availability...
                    </p>
                  )}
                  {emailError && (
                    <p className="text-red-500 text-sm mt-1">{emailError}</p>
                  )}
                </div>

                <div className="flex space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={cancelEdit}
                    className="py-2 px-4 text-white rounded-lg shadow-sm text-base font-medium submit-button hover:cursor-pointer flex items-center"
                    disabled={isSubmitting}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 py-2 px-4 text-white rounded-lg shadow-sm text-base font-medium submit-button hover:cursor-pointer flex items-center justify-center"
                    disabled={isSubmitting}
                  >
                    <Save size={16} className="mr-1" />
                    {isSubmitting ? "Saving..." : "Save Changes"}
                  </button>
                </div>
              </form>
            </>
          ) : (
            // View Mode - Show User Data
            <div className="space-y-4">
              <div>
                <label className="block text-base font-medium">
                  First Name
                </label>
                <p className="mt-1 p-2 bg-white text-black bg-opacity-30 rounded">
                  {userData?.firstname || "Not set"}
                </p>
              </div>

              <div>
                <label className="block text-base font-medium">Last Name</label>
                <p className="mt-1 p-2 bg-white text-black bg-opacity-30 rounded">
                  {userData?.lastname || "Not set"}
                </p>
              </div>

              <div>
                <label className="block text-base font-medium">Username</label>
                <p className="mt-1 p-2 bg-white text-black bg-opacity-30 rounded">
                  {userData?.username || "Not set"}
                </p>
              </div>

              <div>
                <label className="block text-base font-medium">
                  Email Address
                </label>
                <p className="mt-1 p-2 bg-white text-black bg-opacity-30 rounded">
                  {userData?.email || "Not set"}
                </p>
              </div>

              <div className="pt-4">
                <button
                  className="w-full flex justify-center text-white py-2 px-4 border border-transparent rounded-lg shadow-sm text-base font-medium submit-button hover:cursor-pointer"
                  onClick={() => navigate("/me/change-password")}
                >
                  Change Password
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
