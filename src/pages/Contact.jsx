import React from "react";

export default function Contact() {
  return (
    <div className='max-w-md mx-auto px-6 py-20'>
      <div className='bg-white p-8 rounded-[3rem] border-2 border-slate-100 shadow-xl'>
        <h2 className='text-3xl font-black uppercase italic tracking-tighter mb-2'>
          Contact Us
        </h2>
        <p className='text-slate-400 font-bold uppercase tracking-widest text-[9px] mb-8'>
          Reach out to the LibriStack team
        </p>

        <form className='space-y-4'>
          <input
            type='text'
            placeholder='Your Name'
            className='w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none font-bold'
          />
          <textarea
            placeholder='Message'
            rows='4'
            className='w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-indigo-600 rounded-2xl outline-none font-bold'
          ></textarea>
          <button className='w-full py-4 bg-slate-900 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-indigo-600 transition-all'>
            Send Message
          </button>
        </form>
      </div>
    </div>
  );
}
