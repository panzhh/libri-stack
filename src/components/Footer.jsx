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
              className='text-xl font-black italic tracking-tighter uppercase inline-block mb-6'
            >
              Dunn Loring <span className='text-indigo-400'>Library</span>
            </Link>
            <p className='text-slate-400 text-sm leading-relaxed'>
              Equipping the community with spiritual resources and historical
              archives to foster growth and faith in the modern age.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className='font-black uppercase text-[10px] tracking-[0.2em] text-indigo-400 mb-6'>
              Navigation
            </h4>
            <ul className='space-y-4 text-sm font-bold text-slate-300'>
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
            <h4 className='font-black uppercase text-[10px] tracking-[0.2em] text-indigo-400 mb-6'>
              Physical Library
            </h4>
            <ul className='space-y-4 text-sm text-slate-300'>
              <li className='flex flex-col'>
                <span className='font-bold text-white'>Sunday</span>
                <span className='text-xs text-slate-500'>
                  12:00 PM - 13:00 PM
                </span>
              </li>
              {/* <li className='flex flex-col'>
                <span className='font-bold text-white'>Wednesday</span>
                <span className='text-xs text-slate-500'>
                  6:00 PM - 8:00 PM
                </span>
              </li> */}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className='font-black uppercase text-[10px] tracking-[0.2em] text-indigo-400 mb-6'>
              Get In Touch
            </h4>
            <address className='not-italic text-sm text-slate-300 space-y-4'>
              <p className='flex items-start gap-3'>
                <span className='text-indigo-400'>📍</span>
                2317 Morgan Ln,
                <br />
                Dunn Loring, VA 22027
              </p>
              <p className='flex items-center gap-3'>
                <span className='text-indigo-400'>✉️</span>
                fuyinshubao@gmail.com
              </p>
            </address>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className='pt-8 border-t border-slate-800 flex flex-col md:flex-row justify-between items-center gap-4'>
          <p className='text-[10px] font-bold text-slate-500 uppercase tracking-widest'>
            © 2026 Church in Dunn Loring. All Rights Reserved.
          </p>
          <div className='flex gap-8 text-[10px] font-black uppercase tracking-widest text-slate-500'>
            <Link to='/privacy' className='hover:text-indigo-400'>
              Privacy Policy
            </Link>
            <Link to='/terms' className='hover:text-indigo-400'>
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
