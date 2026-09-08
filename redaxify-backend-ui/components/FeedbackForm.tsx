"use client";

import axios from "axios";
import React, { useRef, useState } from "react";
import toast, { Toaster } from "react-hot-toast";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";
import InLoader from "./InLoader";

// Define the type for formData
interface FormDataType {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const FeedbackForm = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<FormDataType>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const textareaRef = useRef<HTMLTextAreaElement | null>(null);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    const dataToSubmit = {
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      number: formData.phone,
      subject: formData.subject,
      message: formData.message,
    };
    try {
      const response = await axios.post(
        `${process.env.NEXT_PUBLIC_REDAXIFY_BACKEND_URL}/api/dashboard/feedback`,
        dataToSubmit
      );
      toast.success("Form submitted successfully!");
      console.log("Form successfully submitted", response.data);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        subject: "",
        message: "",
      });
    } catch (error) {
      console.error("Error submitting form:", error);
      toast.error("There was an error submitting the form.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="mx-auto mt-12 max-w-3xl px-4">
      <Toaster position="top-right" />
      <h1 className="text-center text-4xl md:text-5xl font-bold mb-8 bg-gradient-to-r from-indigo-400 to-blue-600 bg-clip-text text-transparent">
        Get in Touch
      </h1>
      <div className="relative bg-gradient-to-br from-gray-900 to-indigo-950 rounded-2xl shadow-2xl p-8 border border-indigo-500/20 transform transition-all duration-500">
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-500/10 to-blue-500/10 rounded-2xl pointer-events-none animate-pulse" />
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label
                className="block text-sm font-medium text-gray-200 mb-2"
                htmlFor="firstName"
              >
                First Name
              </label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                placeholder="Enter your first name"
                className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-300"
              />
            </div>
            <div>
              <label
                className="block text-sm font-medium text-gray-200 mb-2"
                htmlFor="lastName"
              >
                Last Name
              </label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                placeholder="Enter your last name"
                className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-300"
              />
            </div>
          </div>
          <div>
            <label
              className="block text-sm font-medium text-gray-200 mb-2"
              htmlFor="email"
            >
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="your@email.com"
              className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-300"
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium text-gray-200 mb-2"
              htmlFor="subject"
            >
              Subject
            </label>
            <input
              type="text"
              id="subject"
              name="subject"
              value={formData.subject}
              onChange={handleChange}
              placeholder="What's this about?"
              className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all duration-300"
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium text-gray-200 mb-2"
              htmlFor="phone"
            >
              Phone Number
            </label>
            <PhoneInput
              country={"us"}
              enableSearch={true}
              value={formData.phone}
              onChange={(value: string) => {
                setFormData((prev) => ({
                  ...prev,
                  phone: value,
                }));
              }}
              inputStyle={{
                width: "100%",
                padding: "0.75rem 0.75rem 0.75rem 3rem",
                borderRadius: "0.5rem",
                backgroundColor: "rgba(31, 41, 55, 0.5)",
                border: "1px solid #374151",
                fontSize: "16px",
                color: "#e5e7eb",
                outline: "none",
                transition: "all 0.3s",
              }}
              containerStyle={{
                borderRadius: "0.5rem",
                overflow: "hidden",
              }}
              dropdownStyle={{
                backgroundColor: "#1f2937",
                color: "#e5e7eb",
                border: "1px solid #374151",
              }}
              searchStyle={{
                backgroundColor: "#1f2937",
                color: "#e5e7eb",
                border: "1px solid #374151",
              }}
              buttonStyle={{
                backgroundColor: "#1f2937",
                border: "1px solid #374151",
                borderRight: "none",
              }}
            />
          </div>
          <div>
            <label
              className="block text-sm font-medium text-gray-200 mb-2"
              htmlFor="message"
            >
              Message
            </label>
            <textarea
              id="message"
              name="message"
              value={formData.message}
              onChange={handleChange}
              className="w-full px-4 py-3 rounded-lg bg-gray-800/50 border border-gray-700 text-gray-200 placeholder-gray-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none transition-all duration-300"
              rows={5}
              ref={textareaRef}
              onInput={(e: React.FormEvent<HTMLTextAreaElement>) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = "auto";
                target.style.height = `${target.scrollHeight}px`;
              }}
              placeholder="Tell us your thoughts..."
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3 bg-gradient-to-r from-indigo-600 to-blue-600 text-white rounded-lg font-semibold hover:from-indigo-700 hover:to-blue-700 focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 focus:ring-offset-gray-900 transition-all duration-300 flex justify-center items-center disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? <InLoader size={24} /> : "Send Message"}
          </button>
        </form>
      </div>
    </section>
  );
};

export default FeedbackForm;