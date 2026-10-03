import React, { useState } from "react";
import { API_URL } from "../api";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    message: "",
  });

  const handleSubmit = async (e) => {
    e.preventDefault(); // Prevents the page from refreshing

    try {
      // 1. The POST request to your Flask backend
      const response = await fetch(`${API_URL}/api/contact`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(formData), // Sends {name, email, message}
      });

      const data = await response.json();

      if (response.ok) {
        // 2. Success Feedback
        alert("✨ Message sent! We will get back to you soon.");

        // 3. Reset form so it's ready for a new message
        setFormData({ name: "", email: "", message: "" });
      } else {
        // 4. Handle backend validation errors (e.g., missing fields)
        alert("Error: " + (data.error || "Failed to send message"));
      }
    } catch (error) {
      // 5. Handle network errors (e.g., server is down)
      console.error("Submission error:", error);
      alert("Server is currently offline. Please try again later.");
    }
  };

  return (
    <div className='max-w-xl mx-auto px-6 py-20'>
      <div className='bg-white p-8 sm:p-12 rounded-xl border-2 border-gb-line shadow-sm'>
        <h1 className='gb-h1 mb-2'>
          Contact Us
        </h1>
        <p className='text-black font-bold text-base mb-8'>
          Reach out to the Church in Dunn Loring Library Team
        </p>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* NAME FIELD - REQUIRED */}
          <div>
            <label className='text-base font-bold text-black ml-2 mb-1 block'>
              Your Name <span className='text-rose-700'>*</span>
            </label>
            <input
              type='text'
              required
              placeholder='Enter your full name'
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className='w-full px-5 py-4 bg-white border-2 border-[#9fb3bd] text-black placeholder:text-gb-muted focus:border-gb-dark rounded-lg outline-none font-normal text-lg transition-all'
            />
          </div>

          {/* EMAIL FIELD - REQUIRED */}
          <div>
            <label className='text-base font-bold text-black ml-2 mb-1 block'>
              Email Address <span className='text-rose-700'>*</span>
            </label>
            <input
              type='email'
              required
              placeholder='email@example.com'
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className='w-full px-5 py-4 bg-white border-2 border-[#9fb3bd] text-black placeholder:text-gb-muted focus:border-gb-dark rounded-lg outline-none font-normal text-lg transition-all'
            />
          </div>

          {/* MESSAGE FIELD - REQUIRED */}
          <div>
            <label className='text-base font-bold text-black ml-2 mb-1 block'>
              Message <span className='text-rose-700'>*</span>
            </label>
            <textarea
              required
              placeholder='How can we help you?'
              rows='4'
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              className='w-full px-5 py-4 bg-white border-2 border-[#9fb3bd] text-black placeholder:text-gb-muted focus:border-gb-dark rounded-lg outline-none font-normal text-lg transition-all resize-none'
            ></textarea>
          </div>

          <button
            type='submit'
            className='w-full py-5 bg-gb-dark text-white text-lg font-bold rounded-lg hover:bg-gb-dark hover:shadow-sm hover: transition-all transform active:scale-95 mt-4'
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
