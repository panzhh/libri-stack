import React from "react";
import { Link } from "react-router-dom";

export default function Footer() {
  return (
    <footer className='bg-slate-900 text-white mt-20 rounded-t-[3rem] overflow-hidden'>
      <div className='max-w-7xl mx-auto pt-16 pb-8 px-8'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-12 mb-16'>
          {/* Brand Section */}
          <div className='col-span-1 md:col-span-1'>
            <Link
              to='/'
              className='text-2xl font-black italic tracking-tighter uppercase inline-block mb-6'
            >
              Dunn Loring <span className='text-indigo-300'>Library</span>
            </Link>
            <p className='text-slate-300 text-lg leading-relaxed'>
              Equipping the community with spiritual resources and historical
              archives to foster growth and faith in the modern age.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className='font-black uppercase text-base tracking-[0.2em] text-indigo-300 mb-6'>
              Navigation
            </h4>
            <ul className='space-y-4 text-lg font-bold text-slate-200'>
              <li>
                <Link to='/' className='hover:text-white transition-colors'>
                  Home
                </Link>
              </li>

              <li>
                <Link
                  to='/login'
                  className='hover:text-white transition-colors'
                >
                  Login
                </Link>
              </li>
              <li>
                <Link
                  to='/about'
                  className='hover:text-white transition-colors'
                >
                  About Us
                </Link>
              </li>
              <li>
                <Link
                  to='/contact'
                  className='hover:text-white transition-colors'
                >
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          {/* Library Hours */}
          <div>
            <h4 className='font-black uppercase text-base tracking-[0.2em] text-indigo-300 mb-6'>
              Physical Library
            </h4>
            <ul className='space-y-4 text-lg text-slate-200'>
              <li className='flex flex-col'>
                <span className='font-bold text-white'>Lord's Day</span>
                <span className='text-base text-slate-300'>
                  12:00 PM - 13:00 PM
                </span>
              </li>
              {/* <li className='flex flex-col'>
                <span className='font-bold text-white'>Wednesday</span>
                <span className='text-base text-slate-300'>
                  6:00 PM - 8:00 PM
                </span>
              </li> */}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className='font-black uppercase text-base tracking-[0.2em] text-indigo-300 mb-6'>
              Get In Touch
            </h4>
            <address className='not-italic text-lg text-slate-200 space-y-4'>
              <p className='flex items-start gap-3'>
                <span className='text-indigo-300'>📍</span>
                2317 Morgan Ln,
                <br />
                Dunn Loring, VA 22027
              </p>
              <p className='flex items-center gap-3'>
                <span className='text-indigo-300'>✉️</span>
                fuyinshubao@gmail.com
              </p>
            </address>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className='pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4'>
          <p className='text-sm font-bold text-slate-300 uppercase tracking-widest'>
            © 2026 Church in Dunn Loring. All Rights Reserved.
          </p>
          <div className='flex gap-8 text-sm font-black uppercase tracking-widest text-slate-300'>
            <Link to='/privacy' className='hover:text-indigo-300'>
              Privacy Policy
            </Link>
            <Link to='/terms' className='hover:text-indigo-300'>
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
