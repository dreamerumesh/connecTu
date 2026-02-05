import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useUser } from "../contexts/UserContext";
import toast from "react-hot-toast";

export default function Login() {
  const navigate = useNavigate();
  // const { setUser } = useUser();
  const {sendOTP,verifyOTP,user,isAuthenticated,logout} = useUser();
 
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(Array(6).fill(""));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sessionId, setSessionId] = useState(null);

  const otpRefs = useRef([]);

  useEffect(() => {
  const savedUser = localStorage.getItem("loginUser");

  if (savedUser) {
    const { name, phone } = JSON.parse(savedUser);
    setName(name || "");
    setPhone(phone || "");
  }
}, []);
  // STEP 1 → SEND OTP
  const handleSendOtp = async (e) => {
    e.preventDefault();

    if (!name || !phone) {
      setError("Please enter name and phone number");
      return;
    }

    setError("");
    setLoading(true);

    try {

        localStorage.setItem(
          "loginUser",
          JSON.stringify({ name, phone })
        );

      const response = await sendOTP(phone, name);
       // 🔑 store sessionId
       setSessionId(response.sessionId);

      setStep(2);
    } catch (err) {
      setError(err.message || "Failed to send OTP");
    } finally {
      setLoading(false);
    }
  };

// STEP 2 → VERIFY OTP
const handleVerifyOtp = async (e) => {
  e.preventDefault();

  if (otp.join("").length !== 6) {
    setError("Enter complete OTP");
    return;
  }

  if (!sessionId) {
    setError("Session expired. Please resend OTP");
    return;
  }

  setLoading(true);

  try {
    const user = await verifyOTP(
      phone,
      sessionId,
      otp.join(""),
      name
    );
     toast.success("OTP verified successfully!");
    // setUser(user);
    navigate("/");
  } catch (err) {
    setError(err.message || "OTP verification failed");
     toast.error(err.message || "OTP verification failed");
  } finally {
    setLoading(false);
  }
};

const handleLogout = () => {

  // reset state
  setStep(1);
  setName("");
  setPhone("");
  setOtp(Array(6).fill(""));

  try {
    logout();
    toast.success("Logged out successfully!");
    navigate("/login");
  } catch (err) {
    toast.error(err.message || "Logout failed");
  }
};


  const handleOtpChange = (i, val) => {
    if (!/^\d?$/.test(val)) return;

    const next = [...otp];
    next[i] = val;
    setOtp(next);

    if (val && i < 5) otpRefs.current[i + 1]?.focus();
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-blue-100 px-4">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8 sm:p-10">
        
        {/* HEADER */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold">
            C
          </div>
          <h1 className="text-2xl font-bold text-gray-800">
            Welcome to <span className="text-blue-600">ConnecTu</span>
          </h1>
          {!isAuthenticated && (
            <p className="text-gray-500 text-sm mt-1">
              Sign in with your phone number
            </p>
          )}
        </div>

        {/* ERROR */}
        {error && !isAuthenticated && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
            {error}
          </div>
        )}

        {/* AUTHENTICATED VIEW */}
        {isAuthenticated ? (
          <div className="flex flex-col items-center text-center space-y-6">
            {/* <div className="w-16 h-16 rounded-full bg-blue-600 text-white flex items-center justify-center text-2xl font-bold">
              {name?.charAt(0)?.toUpperCase()}
            </div> */}

            <div className="space-y-1">
              <h2 className="text-xl font-semibold text-gray-800 break-words">
                {user.name}
              </h2>
              <p className="text-gray-500 text-sm break-all">
                {user.phone}
              </p>
            </div>

            <button
              onClick={handleLogout}
              className="w-full sm:w-auto px-8 py-3 bg-red-500 hover:bg-red-600 text-white rounded-lg font-semibold transition"
            >
              Logout
            </button>
          </div>
        ) : (
          <>
            {/* STEP 1 */}
            {step === 1 && (
              <form onSubmit={handleSendOtp} className="space-y-5">
                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Full Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="John Doe"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="98765 43210"
                    className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-3 focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-60"
                >
                  {loading ? "Sending OTP..." : "Continue"}
                </button>
              </form>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <form onSubmit={handleVerifyOtp}>
                <p className="text-sm text-gray-600 mb-6 text-center">
                  Enter the 6-digit OTP sent to <br />
                  <span className="font-semibold text-blue-600">
                    {phone}
                  </span>
                </p>

                <div className="flex justify-between gap-2 mb-6">
                  {otp.map((d, i) => (
                    <input
                      key={i}
                      ref={(el) => (otpRefs.current[i] = el)}
                      value={d}
                      onChange={(e) =>
                        handleOtpChange(i, e.target.value)
                      }
                      maxLength={1}
                      className="w-12 h-12 text-center text-xl font-bold border rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 outline-none"
                    />
                  ))}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg font-semibold transition disabled:opacity-60"
                >
                  {loading ? "Verifying..." : "Verify & Login"}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="w-full mt-4 text-sm text-blue-600 hover:underline"
                >
                  Change phone number
                </button>
              </form>
            )}
          </>
        )}
      </div>
    </div>
  );

}
