import { useEffect, useState } from "react";
import { useParams, useSearchParams, Link } from "react-router-dom";
import { API_URL } from "../api";

export default function VerifyEmail() {
  const { token } = useParams();
  const [searchParams] = useSearchParams();
  const role = searchParams.get("role");

  // 3. State to track the verification process
  const [status, setStatus] = useState("verifying"); // 'verifying', 'success', or 'error'
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const triggerBackendVerification = async () => {
      try {
        // Send the POST request to the Flask Backend (Port 5000)
        const response = await fetch(
          `${API_URL}/api/verify/${token}?role=${role}`,
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
      } catch {
        setStatus("error");
        setErrorMsg("Could not connect to the server.");
      }
    };

    if (token) {
      triggerBackendVerification();
    }
  }, [token, role]);

  return (
    <div className='min-h-screen flex items-center justify-center bg-gb-box p-6'>
      <div className='bg-white w-full max-w-md p-10 rounded-xl shadow-sm border-2 border-gb-line text-center'>
        {/* LOGO / HEADER */}
        <h2 className='text-2xl font-bold mb-6'>
          Church in Dunn Loring Library
        </h2>

        {/* LOADING STATE */}
        {status === "verifying" && (
          <div className='space-y-4'>
            <div className='w-12 h-12 border-4 border-gb-dark border-t-transparent rounded-full animate-spin mx-auto'></div>
            <p className='text-gb-muted font-bold text-xs'>
              Confirming your identity...
            </p>
          </div>
        )}

        {/* SUCCESS STATE */}
        {status === "success" && (
          <div className='space-y-6'>
            <div className='bg-green-100 text-green-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-2xl'>
              ✓
            </div>
            <h1 className='text-2xl font-bold text-black'>
              Account Verified!
            </h1>
            <p className='text-gb-muted text-sm'>
              Your <strong>{role}</strong> account is now active. You can safely
              close this window or log in below.
            </p>
            <Link
              to='/login'
              className='block w-full py-4 bg-gb-dark text-white rounded-lg font-bold hover:scale-[1.02] transition-transform'
            >
              Go to Login
            </Link>
          </div>
        )}

        {/* ERROR STATE */}
        {status === "error" && (
          <div className='space-y-6'>
            <div className='bg-red-100 text-red-700 w-16 h-16 rounded-full flex items-center justify-center mx-auto text-2xl'>
              ✕
            </div>
            <h1 className='text-2xl font-bold text-black'>
              Verification Failed
            </h1>
            <p className='text-red-700 text-sm font-bold '>
              {errorMsg}
            </p>
            <Link
              to='/register'
              className='block w-full py-4 bg-gb-tile text-gb-muted rounded-lg font-bold '
            >
              Try Registering Again
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
