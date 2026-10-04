import React from "react";
import { Link, useLocation } from "react-router-dom";

const linkClass = "underline underline-offset-2 hover:text-gb-darker";

export default function Footer() {
  // Re-render on navigation so the links follow login/logout, like the Navbar
  useLocation();
  const token = localStorage.getItem("token");
  const role = localStorage.getItem("role");

  const links = [
    { to: "/", label: "Home" },
    ...(!token
      ? [
          { to: "/login", label: "Login" },
          { to: "/register", label: "Register" },
        ]
      : role === "admin"
        ? [
            { to: "/admin-dashboard", label: "Admin Panel" },
            { to: "/user-dashboard", label: "My Borrows" },
            { to: "/order-books", label: "Order Books" },
          ]
        : [
            { to: "/user-dashboard", label: "My Dashboard" },
            { to: "/order-books", label: "Order Books" },
          ]),
    { to: "/about", label: "About Us" },
    { to: "/contact", label: "Contact" },
  ];

  return (
    <footer className='bg-gb-nav text-black mt-16 border-t-4 border-gb-teal'>
      <div className='max-w-7xl mx-auto pt-12 pb-8 px-6'>
        <div className='grid grid-cols-1 md:grid-cols-4 gap-10 mb-10'>
          {/* Brand Section */}
          <div>
            <Link
              to='/'
              className='font-serif text-2xl leading-tight inline-block mb-4'
            >
              Church in Dunn Loring{" "}
              <span className='font-bold text-gb-darker'>Library</span>
            </Link>
            <p className='text-lg leading-relaxed'>
              Our burden and goal is to stir up the saints' interest in
              pursuing the truth and to encourage them to enjoy reading the
              spiritual publications.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className='text-lg font-bold mb-4'>Navigation</h4>
            <ul className='space-y-3 text-lg'>
              {links.map((link) => (
                <li key={link.to}>
                  <Link to={link.to} className={linkClass}>
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Library Hours */}
          <div>
            <h4 className='text-lg font-bold mb-4'>Physical Library</h4>
            <ul className='space-y-3 text-lg'>
              <li className='flex flex-col'>
                <span className='font-bold'>Lord's Day</span>
                <span>12:00 PM - 13:00 PM</span>
              </li>
              {/* <li className='flex flex-col'>
                <span className='font-bold'>Wednesday</span>
                <span>6:00 PM - 8:00 PM</span>
              </li> */}
            </ul>
          </div>

          {/* Contact Info */}
          <div>
            <h4 className='text-lg font-bold mb-4'>Get in Touch</h4>
            <address className='not-italic text-lg space-y-3'>
              <p>
                2317 Morgan Ln,
                <br />
                Dunn Loring, VA 22027
              </p>
              <p>
                <a href='mailto:churchlibdl@gmail.com' className={linkClass}>
                  churchlibdl@gmail.com
                </a>
              </p>
            </address>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className='pt-6 border-t border-gb-teal text-base text-center md:text-left'>
          <p>© 2026 Church in Dunn Loring. All Rights Reserved.</p>
        </div>
      </div>
    </footer>
  );
}
