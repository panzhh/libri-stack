import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";

export default function VerifyEmail() {
  // 1. Get the token from the URL path /verify/:token
  const { token } = useParams();

  // 2. Get the role from the query string ?role=admin
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role");
  console.log("role is", role);

  // 3. State to track the verification process
  const [status, setStatus] = useState("verifying"); // 'verifying', 'success', or 'error'
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const triggerBackendVerification = async () => {
      try {
        // Send the POST request to the Flask Backend (Port 5000)
        const response = await fetch(
          `http://localhost:5000/api/verify/${token}?role=${role}`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ role: role }),
          },
        );

        const data = await response.json();

        if (response.ok) {
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMsg(data.msg || "Verification failed.");
        }
      } catch (err) {
        setStatus("error");
        setErrorMsg("Could not connect to the server.");
      }
    };

    if (token) {
      triggerBackendVerification();
    }
  }, [token, role]);

  return (
    <div className='min-h-screen flex items-center justify-center bg-slate-50 p-6'>
      <div className='bg-white w-full max-w-md p-10 rounded-[3rem] shadow-2xl border-2 border-slate-100 text-center'>
        {/* LOGO / HEADER */}
        <h2 className='text-2xl font-black uppercase italic tracking-tighter mb-6'>
          Libri<span className='text-indigo-600'>Stack</span>
        </h2>

        {/* LOADING STATE */}
        {status === "verifying" && (
          <div className='space-y-4'>
            <div className='w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin mx-auto'></div>
            <p className='text-slate-500 font-bold uppercase tracking-widest text-xs'>
              Confirming your identity...
            </p>
          </div>
        )}

        {/* SUCCESS STATE */}
        {status === "success" && (
          <div className='space-y-6'>
            <div className='bg-green-100 text-green-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-2xl'>
              ✓
            </div>
            <h1 className='text-2xl font-black text-slate-800'>
              Account Verified!
            </h1>
            <p className='text-slate-500 text-sm'>
              Your <strong>{role}</strong> account is now active. You can safely
              close this window or log in below.
            </p>
            <Link
              to='/login'
              className='block w-full py-4 bg-indigo-600 text-white rounded-2xl font-black uppercase tracking-widest hover:scale-[1.02] transition-transform'
            >
              Go to Login
            </Link>
          </div>
        )}

        {/* ERROR STATE */}
        {status === "error" && (
          <div className='space-y-6'>
            <div className='bg-red-100 text-red-600 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-2xl'>
              ✕
            </div>
            <h1 className='text-2xl font-black text-slate-800'>
              Verification Failed
            </h1>
            <p className='text-red-500 text-sm font-bold uppercase'>
              {errorMsg}
            </p>
            <Link
              to='/register'
              className='block w-full py-4 bg-slate-100 text-slate-600 rounded-2xl font-black uppercase tracking-widest'
            >
              Try Registering Again
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
