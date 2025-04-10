import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useAuthStore from "../store/authStore";

export default function ChangePassword() {
  const API_URL = import.meta.env.VITE_API_URL;
  const { token } = useAuthStore();
  const navigate = useNavigate();

  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [currentPasswordError, setCurrentPasswordError] = useState("");
  const [newPasswordError, setNewPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");
  const [serverError, setServerError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    // If not logged in, redirect to login
    if (!token) {
      navigate("/login");
    }
  }, [token, navigate]);

  const validateForm = () => {
    let isValid = true;

    // Validate current password
    if (!currentPassword) {
      setCurrentPasswordError("Current password is required");
      isValid = false;
    } else {
      setCurrentPasswordError("");
    }

    // Validate new password
    if (!newPassword) {
      setNewPasswordError("New password is required");
      isValid = false;
    } else if (newPassword.length < 8) {
      setNewPasswordError("Password must be at least 8 characters long");
      isValid = false;
    } else {
      setNewPasswordError("");
    }

    // Validate confirm password
    if (!confirmPassword) {
      setConfirmPasswordError("Please confirm your new password");
      isValid = false;
    } else if (confirmPassword !== newPassword) {
      setConfirmPasswordError("Passwords do not match");
      isValid = false;
    } else {
      setConfirmPasswordError("");
    }

    return isValid;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    // Reset messages
    setServerError("");
    setSuccessMessage("");

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`${API_URL}/general/change-password`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          current_password: currentPassword,
          new_password: newPassword,
        }),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccessMessage("Password changed successfully!");
        // Clear form
        setCurrentPassword("");
        setNewPassword("");
        setConfirmPassword("");

        // Redirect to profile after a short delay
        setTimeout(() => {
          navigate("/me/profile");
        }, 2000);
      } else {
        setServerError(data.detail || "Failed to change password");
      }
    } catch (error) {
      setServerError("Network error. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center">
      <div className="w-full max-w-md card-background p-10 rounded-lg shadow-lg">
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

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label
              htmlFor="currentPassword"
              className="block text-base font-medium"
            >
              Current Password
            </label>
            <input
              id="currentPassword"
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 text-black bg-white p-2"
              placeholder="Enter your current password"
            />
            {currentPasswordError && (
              <p className="text-red-500 text-sm mt-1">
                {currentPasswordError}
              </p>
            )}
          </div>

          <div>
            <label
              htmlFor="newPassword"
              className="block text-base font-medium"
            >
              New Password
            </label>
            <input
              id="newPassword"
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="mt-1 block w-full rounded-md border border-gray-300 text-black bg-white p-2"
              placeholder="Enter your new password"
            />
            {newPasswordError && (
              <p className="text-red-500 text-sm mt-1">{newPasswordError}</p>
            )}
          </div>

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
              className="mt-1 block w-full rounded-md border border-gray-300 text-black bg-white p-2"
              placeholder="Confirm your new password"
            />
            {confirmPasswordError && (
              <p className="text-red-500 text-sm mt-1">
                {confirmPasswordError}
              </p>
            )}
          </div>

          <div className="flex space-x-4">
            <button
              type="button"
              onClick={() => navigate("/me/profile")}
              className="py-2 px-4 submit-button text-white rounded-lg shadow-sm text-base font-medium hover:cursor-pointer"
              disabled={isSubmitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 px-4 text-white rounded-lg shadow-sm text-base font-medium submit-button hover:cursor-pointer"
              disabled={isSubmitting}
            >
              {isSubmitting ? "Changing..." : "Change Password"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
