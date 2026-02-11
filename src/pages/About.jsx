import React from "react";

export default function About() {
  return (
    <div className='max-w-4xl mx-auto px-6 py-20 text-center'>
      <h1 className='text-5xl font-black italic uppercase tracking-tighter mb-6'>
        Our <span className='text-indigo-600'>Mission</span>
      </h1>
      <p className='text-slate-600 text-lg leading-relaxed font-medium'>
        LibriStack is a modern digital archive designed to organize and manage
        extensive book collections. With nearly 5,000 titles, our goal is to
        make literature accessible and searchable for everyone.
      </p>
    </div>
  );
}
