import React from "react";

export default function About() {
  const faqs = [
    {
      q: "Who can use this library?",
      a: "All members and regular attenders of the Church in Dunn Loring are welcome to register and borrow resources.",
    },
    {
      q: "How can I be a library admin?",
      a: "You can register directly as an admin, but you will need a registration invitation code, which you can obtain from any existing admin. Alternatively, you can register as a user and request that an admin promote you to admin status.",
    },
    {
      q: "How long can I keep a book?",
      a: "The standard borrowing period is 30 days. You can renew your book once via your dashboard if there are no pending requests.",
    },
    {
      q: "Where do I return physical books?",
      a: "Please place physical books in the designated drop-box in the church foyer. Remember to also click 'Return' in your digital dashboard.",
    },
  ];

  return (
    <div className='max-w-5xl mx-auto px-6 py-12 animate-in fade-in duration-700'>
      {/* --- HERO SECTION --- */}
      <section className='bg-slate-200 p-12 rounded-[3rem] border border-slate-400 shadow-sm mb-12'>
        <h1 className='text-5xl font-black italic text-slate-900 uppercase tracking-tighter mb-6'>
          Our <span className='text-indigo-600'>Mission</span>
        </h1>
        <p className='text-lg text-black leading-relaxed font-medium max-w-3xl'>
          The Church in Dunn Loring Library is dedicated to equipping the
          community with the spiritual resources and historical archives to
          foster growth in the modern age.
        </p>
      </section>

      {/* --- HOW TO USE SECTION --- */}
      <section className='mb-20 px-4'>
        <h2 className='text-2xl font-black text-white uppercase italic mb-10 tracking-tight drop-shadow'>
          Getting <span className='text-indigo-300'>Started</span>
        </h2>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-12'>
          <div className='space-y-4'>
            <div className='w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black shadow-lg shadow-indigo-200'>
              1
            </div>
            <h3 className='font-black text-white uppercase text-base tracking-wide drop-shadow'>
              Book Browse
            </h3>
            <p className='text-white text-base leading-relaxed drop-shadow'>
              Explore our collection of spiritual resources. Filter by title,
              language or search for specific authors.
            </p>
          </div>

          <div className='space-y-4'>
            <div className='w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black shadow-lg shadow-indigo-200'>
              2
            </div>
            <h3 className='font-black text-white uppercase text-base tracking-wide drop-shadow'>
              Borrow Instantly
            </h3>
            <p className='text-white text-base leading-relaxed drop-shadow'>
              Found a book? Borrow it with one click. It will be added
              immediately to your personal shelf.
            </p>
          </div>

          <div className='space-y-4'>
            <div className='w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black shadow-lg shadow-indigo-200'>
              3
            </div>
            <h3 className='font-black text-white uppercase text-base tracking-wide drop-shadow'>
              Manage Shelf
            </h3>
            <p className='text-white text-base leading-relaxed drop-shadow'>
              Track due dates and return books digitally through your dashboard
              to keep our library moving.
            </p>
          </div>
        </div>
      </section>

      {/* --- FAQ SECTION --- */}
      <section className='bg-slate-300 p-12 rounded-[3.5rem] border border-slate-400'>
        <div className='flex items-center gap-4 mb-10'>
          <h2 className='text-2xl font-black text-slate-900 uppercase italic tracking-tight'>
            Common <span className='text-indigo-600'>Questions</span>
          </h2>
        </div>

        <div className='grid grid-cols-1 gap-4'>
          {faqs.map((item, index) => (
            <div
              key={index}
              className='p-8 bg-slate-200 rounded-[2rem] border border-slate-400 group hover:border-indigo-300 transition-all duration-300 shadow-sm'
            >
              <h4 className='font-black text-black text-sm uppercase mb-3 flex items-center gap-3'>
                <span className='text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-xs'>
                  Q
                </span>
                {item.q}
              </h4>
              <p className='text-black text-base leading-relaxed pl-8 border-l-2 border-slate-50 group-hover:border-indigo-100'>
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* --- FOOTER NOTE --- */}
      <div className='mt-12 text-center'>
        <p className='text-white text-sm font-bold uppercase tracking-[0.2em] drop-shadow'>
          Est. 2024 • Building Faith Through Knowledge
        </p>
      </div>
    </div>
  );
}
