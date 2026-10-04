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
      <section className='bg-white p-12 rounded-xl border border-gb-line shadow-sm mb-12'>
        <h1 className='gb-h1 mb-6'>
          Our Mission
        </h1>
        <p className='text-lg text-black leading-relaxed font-medium max-w-3xl'>
          Our burden and goal is to stir up the saints' interest in pursuing
          the truth and to encourage them to enjoy reading the spiritual
          publications.
        </p>
      </section>

      {/* --- HOW TO USE SECTION --- */}
      <section className='mb-20 px-4'>
        <h2 className='text-2xl font-bold text-black mb-10 '>
          Getting Started
        </h2>

        <div className='grid grid-cols-1 md:grid-cols-3 gap-12'>
          <div className='space-y-4'>
            <div className='w-12 h-12 bg-gb-dark text-black rounded-lg flex items-center justify-center font-bold shadow-sm '>
              1
            </div>
            <h3 className='font-bold text-black text-base '>
              Book Browse
            </h3>
            <p className='text-black text-base leading-relaxed '>
              Explore our collection of spiritual resources. Filter by title,
              language or search for specific authors.
            </p>
          </div>

          <div className='space-y-4'>
            <div className='w-12 h-12 bg-gb-dark text-black rounded-lg flex items-center justify-center font-bold shadow-sm '>
              2
            </div>
            <h3 className='font-bold text-black text-base '>
              Borrow Instantly
            </h3>
            <p className='text-black text-base leading-relaxed '>
              Found a book? Borrow it with one click. It will be added
              immediately to your personal shelf.
            </p>
          </div>

          <div className='space-y-4'>
            <div className='w-12 h-12 bg-gb-dark text-black rounded-lg flex items-center justify-center font-bold shadow-sm '>
              3
            </div>
            <h3 className='font-bold text-black text-base '>
              Manage Shelf
            </h3>
            <p className='text-black text-base leading-relaxed '>
              Track due dates and return books digitally through your dashboard
              to keep our library moving.
            </p>
          </div>
        </div>
      </section>

      {/* --- FAQ SECTION --- */}
      <section className='bg-gb-box p-12 rounded-xl border border-gb-line'>
        <div className='flex items-center gap-4 mb-10'>
          <h2 className='text-2xl font-bold text-black '>
            Common Questions
          </h2>
        </div>

        <div className='grid grid-cols-1 gap-4'>
          {faqs.map((item, index) => (
            <div
              key={index}
              className='p-8 bg-white rounded-xl border border-gb-line group hover:border-indigo-300 transition-all duration-300 shadow-sm'
            >
              <h4 className='font-bold text-black text-sm mb-3 flex items-center gap-3'>
                <span className='text-gb-darker bg-gb-box px-2 py-0.5 rounded text-xs'>
                  Q
                </span>
                {item.q}
              </h4>
              <p className='text-black text-base leading-relaxed pl-8 border-l-2 border-gb-line group-hover:border-gb-line'>
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* --- FOOTER NOTE --- */}
      <div className='mt-12 text-center'>
        <p className='text-black text-sm font-bold '>
          Est. 2026 • Building Faith Through Ministry
        </p>
      </div>
    </div>
  );
}
