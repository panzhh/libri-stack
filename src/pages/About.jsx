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
      <section className='bg-white p-12 rounded-[3rem] border border-slate-100 shadow-sm mb-12'>
        <h1 className='text-5xl font-black italic text-slate-900 uppercase tracking-tighter mb-6'>
          Our <span className='text-indigo-600'>Mission</span>
        </h1>
        <p className='text-lg text-slate-600 leading-relaxed font-medium max-w-3xl'>
          The Church in Dunn Loring Library is dedicated to the spiritual
          nourishment and intellectual growth of our community. We provide
          access to sound teaching and inspiring literature to support a
          thriving life of faith.
        </p>
      </section>

      {/* --- HOW TO USE SECTION --- */}
      <section className='mb-20 px-4'>
        <h2 className='text-2xl font-black text-slate-900 uppercase italic mb-10 tracking-tight'>
          Getting <span className='text-indigo-600'>Started</span>
        </h2>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-12'>
          <div className='space-y-4'>
            <div className='w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black shadow-lg shadow-indigo-200'>
              1
            </div>
            <h3 className='font-black text-slate-800 uppercase text-sm tracking-wide'>
              Book Browse
            </h3>
            <p className='text-slate-500 text-sm leading-relaxed'>
              Explore our collection of spiritual resources. Filter by title,
              language or search for specific authors.
            </p>
          </div>

          <div className='space-y-4'>
            <div className='w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black shadow-lg shadow-indigo-200'>
              2
            </div>
            <h3 className='font-black text-slate-800 uppercase text-sm tracking-wide'>
              Borrow Instantly
            </h3>
            <p className='text-slate-500 text-sm leading-relaxed'>
              Found a book? Borrow it with one click. It will be added
              immediately to your personal shelf.
            </p>
          </div>

          <div className='space-y-4'>
            <div className='w-12 h-12 bg-indigo-600 text-white rounded-2xl flex items-center justify-center font-black shadow-lg shadow-indigo-200'>
              3
            </div>
            <h3 className='font-black text-slate-800 uppercase text-sm tracking-wide'>
              Manage Shelf
            </h3>
            <p className='text-slate-500 text-sm leading-relaxed'>
              Track due dates and return books digitally through your dashboard
              to keep our library moving.
            </p>
          </div>
        </div>
      </section>

      {/* --- FAQ SECTION --- */}
      <section className='bg-slate-50 p-12 rounded-[3.5rem] border border-slate-100'>
        <div className='flex items-center gap-4 mb-10'>
          <h2 className='text-2xl font-black text-slate-900 uppercase italic tracking-tight'>
            Common <span className='text-indigo-600'>Questions</span>
          </h2>
        </div>

        <div className='grid grid-cols-1 gap-4'>
          {faqs.map((item, index) => (
            <div
              key={index}
              className='p-8 bg-white rounded-[2rem] border border-slate-100 group hover:border-indigo-300 transition-all duration-300 shadow-sm'
            >
              <h4 className='font-black text-slate-800 text-sm uppercase mb-3 flex items-center gap-3'>
                <span className='text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded text-[10px]'>
                  Q
                </span>
                {item.q}
              </h4>
              <p className='text-slate-500 text-sm leading-relaxed pl-8 border-l-2 border-slate-50 group-hover:border-indigo-100'>
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* --- FOOTER NOTE --- */}
      <div className='mt-12 text-center'>
        <p className='text-slate-400 text-xs font-bold uppercase tracking-[0.2em]'>
          Est. 2024 • Building Faith Through Knowledge
        </p>
      </div>
    </div>
  );
}
