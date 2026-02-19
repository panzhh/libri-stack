import React, { useState } from "react";

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
      const response = await fetch("http://localhost:5000/api/contact", {
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
    <div className='max-w-md mx-auto px-6 py-20'>
      <div className='bg-white p-8 rounded-[3rem] border-2 border-slate-100 shadow-xl'>
        <h2 className='text-3xl font-black uppercase italic tracking-tighter mb-2'>
          Contact Us
        </h2>
        <p className='text-slate-400 font-bold uppercase tracking-widest text-[9px] mb-8'>
          Reach out to the LibriStack team
        </p>

        <form onSubmit={handleSubmit} className='space-y-4'>
          {/* NAME FIELD - REQUIRED */}
          <div>
            <label className='text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block'>
              Your Name <span className='text-rose-500'>*</span>
            </label>
            <input
              type='text'
              required
              placeholder='Enter your full name'
              value={formData.name}
              onChange={(e) =>
                setFormData({ ...formData, name: e.target.value })
              }
              className='w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none font-bold transition-all'
            />
          </div>

          {/* EMAIL FIELD - REQUIRED */}
          <div>
            <label className='text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block'>
              Email Address <span className='text-rose-500'>*</span>
            </label>
            <input
              type='email'
              required
              placeholder='email@example.com'
              value={formData.email}
              onChange={(e) =>
                setFormData({ ...formData, email: e.target.value })
              }
              className='w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none font-bold transition-all'
            />
          </div>

          {/* MESSAGE FIELD - REQUIRED */}
          <div>
            <label className='text-[9px] font-black text-slate-400 uppercase ml-2 mb-1 block'>
              Message <span className='text-rose-500'>*</span>
            </label>
            <textarea
              required
              placeholder='How can we help you?'
              rows='4'
              value={formData.message}
              onChange={(e) =>
                setFormData({ ...formData, message: e.target.value })
              }
              className='w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 focus:bg-white rounded-2xl outline-none font-bold transition-all resize-none'
            ></textarea>
          </div>

          <button
            type='submit'
            className='w-full py-5 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-rose-500 hover:shadow-lg hover:shadow-rose-200 transition-all transform active:scale-95 mt-4'
          >
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
