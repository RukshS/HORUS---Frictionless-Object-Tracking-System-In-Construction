import React, { useState, type ChangeEvent, type FormEvent } from "react";
import { FiSend } from "react-icons/fi";
import emailjs from '@emailjs/browser';
import { EMAILJS_CONFIG, isEmailJSConfigured } from '../../config/emailConfig';

interface FormData {
  name: string;
  email: string;
  message: string;
}

const Contact: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({ name: "", email: "", message: "" });
  const [status, setStatus] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const handleChange = (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setStatus("Sending...");

    try {
      // Check if EmailJS is properly configured
      if (!isEmailJSConfigured()) {
        // Fallback: Create a mailto link as a temporary solution
        const subject = `Contact Form Message from ${formData.name}`;
        const body = `Name: ${formData.name}\nEmail: ${formData.email}\n\nMessage:\n${formData.message}`;
        const mailtoLink = `mailto:${EMAILJS_CONFIG.defaultEmail}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        
        // Open default email client
        window.open(mailtoLink);
        
        setStatus("Email client opened! Please send the pre-filled email. Configure EmailJS for automatic sending.");
        setFormData({ name: "", email: "", message: "" });
        return;
      }

      // Template parameters for EmailJS
      const templateParams = {
        from_name: formData.name,
        from_email: formData.email,
        message: formData.message,
        to_email: EMAILJS_CONFIG.defaultEmail,
        reply_to: formData.email,
      };

      // Send email using EmailJS
      const response = await emailjs.send(
        EMAILJS_CONFIG.serviceId,
        EMAILJS_CONFIG.templateId,
        templateParams,
        EMAILJS_CONFIG.publicKey
      );

      if (response.status === 200) {
        setStatus("Message sent successfully! We'll get back to you soon.");
        setFormData({ name: "", email: "", message: "" });
      } else {
        setStatus("Failed to send message. Please try again.");
      }
    } catch (error) {
      console.error('EmailJS Error:', error);
      setStatus("Network error. Please check your connection and try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div id="ContactUs" className="w-full flex flex-col items-center justify-center min-h-screen py-8 lg:py-16 mt-[-300px] lg:mt-[-130px]">
      <div className="w-full max-w-md sm:max-w-lg lg:max-w-xl px-4 sm:px-6 lg:px-8">
        <div className="bg-white p-6 sm:p-8 lg:p-10 rounded-2xl shadow-lg">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-center mb-8 lg:mb-12 text-gray-800">
            Contact <span className="text-red-500 text-2xl sm:text-3xl lg:text-4xl">Us</span>
          </h2>
          <form className="space-y-4 lg:space-y-6" onSubmit={handleSubmit}>
            <div className="flex flex-col sm:flex-row sm:space-x-3 space-y-4 sm:space-y-0">
              <input
                name="name"
                type="text"
                placeholder="Name"
                value={formData.name}
                onChange={handleChange}
                className="bg-slate-300 w-full sm:w-1/2 p-3 lg:p-4 text-base lg:text-lg rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
              <input
                name="email"
                type="email"
                placeholder="Email"
                value={formData.email}
                onChange={handleChange}
                className="bg-slate-300 w-full sm:w-1/2 p-3 lg:p-4 text-base lg:text-lg rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all"
                required
              />
            </div>
            <div className="relative">
              <textarea
                name="message"
                placeholder="Message"
                value={formData.message}
                onChange={handleChange}
                className="w-full p-3 lg:p-4 text-base lg:text-lg bg-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all resize-none h-32 lg:h-40"
                required
              />
              <button
                type="submit"
                disabled={isLoading}
                className={`absolute bottom-2 right-2 p-2 lg:p-3 rounded-full text-white transition-all shadow-lg z-10 ${
                  isLoading 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-red-500 hover:bg-red-600 hover:scale-105'
                }`}
                aria-label="Send message"
              >
                <FiSend size={18} className="lg:w-5 lg:h-5" />
              </button>
            </div>
          </form>
          {status && (
            <p className="mt-4 lg:mt-6 text-center text-sm lg:text-base text-green-700 p-3 bg-green-100 rounded-md">
              {status}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contact;
