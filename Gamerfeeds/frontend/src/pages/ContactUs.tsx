import { useState, ChangeEvent, FormEvent, useEffect } from "react";
import { Send, AlertTriangle } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

interface FormData {
  email: string;
  title: string;
  content: string;
}

interface SubmitStatus {
  success: boolean;
  message: string;
}

export default function ContactUs() {
  const [formData, setFormData] = useState<FormData>({
    email: "",
    title: "",
    content: "",
  });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submitStatus, setSubmitStatus] = useState<SubmitStatus | null>(null);
  const [emailError, setEmailError] = useState<string>("");
  const [titleError, setTitleError] = useState<string>("");
  const [contentError, setContentError] = useState<string>("");

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, []);

  const validateForm = (): boolean => {
    let isValid = true;

    // Reset errors
    setEmailError("");
    setTitleError("");
    setContentError("");

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email.trim()) {
      setEmailError("Email is required");
      isValid = false;
    } else if (!emailRegex.test(formData.email)) {
      setEmailError("Please enter a valid email address");
      isValid = false;
    }

    // Title validation
    if (!formData.title.trim()) {
      setTitleError("Subject is required");
      isValid = false;
    } else if (formData.title.trim().length < 3) {
      setTitleError("Subject must be at least 3 characters");
      isValid = false;
    } else if (formData.title.trim().length > 100) {
      setTitleError("Subject must be less than 100 characters");
      isValid = false;
    }

    // Content validation
    if (!formData.content.trim()) {
      setContentError("Message is required");
      isValid = false;
    } else if (formData.content.trim().length < 10) {
      setContentError("Message must be at least 10 characters");
      isValid = false;
    }

    return isValid;
  };

  const handleChange = (
    e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      const response = await fetch(`${API_URL}/auth/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        const data = await response.json();
        setSubmitStatus({
          success: true,
          message:
            data.message ||
            "Your message has been sent successfully! We'll get back to you soon.",
        });
        setFormData({ email: "", title: "", content: "" });
      } else {
        const errorData = await response.json();
        setSubmitStatus({
          success: false,
          message:
            errorData.detail ||
            "There was an error sending your message. Please try again later.",
        });
      }
    } catch (error) {
      console.error("Error submitting contact form:", error);
      setSubmitStatus({
        success: false,
        message:
          "There was an error sending your message. Please try again later.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col min-h-screen max-w-7xl mt-25 z-10 mx-auto">
      <h1 className="text-3xl font-[Black_Ops_One] mb-8 div-header">
        Contact Us
      </h1>
      <div className="max-w-4xl mx-auto w-full mb-8 card-background p-10 rounded-lg">
        <p className="mb-6 text-lg">
          Have questions or feedback? We'd love to hear from you! Fill out the
          form below and we'll get back to you as soon as possible.
        </p>

        {submitStatus && (
          <div
            className={`mb-6 p-3 text-center ${
              submitStatus.success ? "text-green-500" : "text-red-500"
            }`}
          >
            {!submitStatus.success && (
              <AlertTriangle size={20} className="mr-2 flex-shrink-0 mt-0.5" />
            )}
            <p>{submitStatus.message}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block mb-2 font-medium">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              className={`w-full p-3 rounded-lg bg-white text-black ${
                emailError
                  ? "border-2 border-red-500"
                  : "border border-gray-300"
              }`}
            />
            {emailError && (
              <p className="text-red-500 text-sm mt-1">{emailError}</p>
            )}
          </div>

          <div>
            <label htmlFor="title" className="block mb-2 font-medium">
              Subject
            </label>
            <input
              type="text"
              id="title"
              name="title"
              value={formData.title}
              onChange={handleChange}
              placeholder="What is your message about?"
              className={`w-full p-3 rounded-lg bg-white text-black ${
                titleError
                  ? "border-2 border-red-500"
                  : "border border-gray-300"
              }`}
            />
            {titleError && (
              <p className="text-red-500 text-sm mt-1">{titleError}</p>
            )}
          </div>

          <div>
            <label htmlFor="content" className="block mb-2 font-medium">
              Message
            </label>
            <textarea
              id="content"
              name="content"
              value={formData.content}
              onChange={handleChange}
              placeholder="How can we help you?"
              rows={8}
              className={`w-full p-3 rounded-lg bg-white text-black ${
                contentError
                  ? "border-2 border-red-500"
                  : "border border-gray-300"
              }`}
            />
            {contentError && (
              <p className="text-red-500 text-sm mt-1">{contentError}</p>
            )}
          </div>

          <div className="pt-4">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex items-center px-6 py-3 submit-button text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:cursor-pointer"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin h-4 w-4 border-2 border-white rounded-full mr-2"></div>
                  Sending...
                </>
              ) : (
                <>
                  <Send size={18} className="mr-2" />
                  Send Message
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
