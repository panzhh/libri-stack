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
      <div className='bg-slate-200 p-8 sm:p-12 rounded-[3rem] border-2 border-slate-400 shadow-xl'>
        <h2 className='text-4xl font-black uppercase italic tracking-tighter mb-2'>
          Contact Us
        </h2>
        <p className='text-slate-800 font-bold uppercase tracking-widest text-base mb-8'>
          Reach out to the Church in Dunn Loring Library Team
        </p>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* NAME FIELD - REQUIRED */}
          <div>
            <label className='text-base font-black text-slate-800 uppercase ml-2 mb-1 block'>
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
              className='w-full px-5 py-4 bg-white border-2 border-slate-400 text-slate-900 placeholder:text-slate-500 focus:border-indigo-700 rounded-2xl outline-none font-bold text-lg transition-all'
            />
          </div>

          {/* EMAIL FIELD - REQUIRED */}
          <div>
            <label className='text-base font-black text-slate-800 uppercase ml-2 mb-1 block'>
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
              className='w-full px-5 py-4 bg-white border-2 border-slate-400 text-slate-900 placeholder:text-slate-500 focus:border-indigo-700 rounded-2xl outline-none font-bold text-lg transition-all'
            />
          </div>

          {/* MESSAGE FIELD - REQUIRED */}
          <div>
            <label className='text-base font-black text-slate-800 uppercase ml-2 mb-1 block'>
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
              className='w-full px-5 py-4 bg-white border-2 border-slate-400 text-slate-900 placeholder:text-slate-500 focus:border-indigo-700 rounded-2xl outline-none font-bold text-lg transition-all resize-none'
            ></textarea>
          </div>

          <button
            type='submit'
            className='w-full py-5 bg-slate-900 text-white text-lg font-black uppercase tracking-widest rounded-2xl hover:bg-rose-500 hover:shadow-lg hover:shadow-rose-200 transition-all transform active:scale-95 mt-4'
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
