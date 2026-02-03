import React, { useCallback, useEffect, useRef, useState } from "react";
import LoginLogo from "../../assets/LoginLogo.png";
import Logo from "../../assets/Logo.png";
import Input from "../../shared/components/Input";
import LifeCycle from "../../assets/icons/LifeCycle.svg";
import Radar from "../../assets/icons/Radar.svg";
import Condition360 from "../../assets/icons/Condition360.svg";
import ControlMap from "../../assets/icons/ControlMap.svg";
import Quoter from "../../assets/icons/Quoter.svg";
import { Link, useNavigate } from "react-router-dom";
import { googleLogin, login } from "../../shared/services/authService";

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [Error, setError] = useState({});
  const googleButtonRef = useRef(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
  const allowedOrigins = (import.meta.env.VITE_GOOGLE_ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
  const originAllowed =
    allowedOrigins.length === 0 || allowedOrigins.includes(window.location.origin);

  const handleGoogleResponse = useCallback(async (response) => {
    if (!response?.credential) {
      setError({ api: "Google login failed" });
      return;
    }

    try {
      const data = await googleLogin(response.credential);
      localStorage.setItem("token", data.access_token);
      navigate("/clients");
    } catch (err) {
      console.error("Google login failed:", err.response?.data || err.message);
      setError({ api: "Google login failed" });
    }
  }, [navigate]);

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) return;
    if (!originAllowed) return;

    const scriptId = "google-identity-services";
    const initializeGoogle = () => {
      if (!window.google?.accounts?.id || !googleButtonRef.current) return;
      googleButtonRef.current.innerHTML = "";
      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: handleGoogleResponse,
      });
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: "outline",
        size: "large",
      });
    };

    if (document.getElementById(scriptId)) {
      initializeGoogle();
      return;
    }

    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    script.onerror = () => setError({ api: "Unable to load Google login" });
    document.body.appendChild(script);
  }, [googleClientId, handleGoogleResponse, originAllowed]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError({});

    let newErrors = {};

    if (!email) newErrors.email = "Email is required";
    if (!password) newErrors.password = "Password is required";

    if (Object.keys(newErrors).length > 0) {
      setError(newErrors);
      return;
    }

    try {
      const data = await login({
        email: email,
        password: password,
      });

      console.log("Login success:", data);

      localStorage.setItem("token", data.access_token);
      navigate("/clients");

    } catch (err) {
      console.error("Login failed:", err.response?.data || err.message);
      setError({ api: "Invalid email or password" });
    }
  };

  return (
    <div>
      <div className="bg-[#F8F8FC] flex flex-col min-h-screen pb-10">

        {/* Top Logo */}
        <div className="flex items-center justify-center mt-12 md:mt-16">
          <img src={LoginLogo} alt="Login Logo" className="h-12 md:h-16" />
        </div>

        {/* Main Container */}
        <div className="flex flex-col md:flex-row justify-center items-stretch mx-auto max-w-5xl w-full mt-6 px-4 md:px-0">

          {/* Left side - Image */}
          <div className="hidden md:block md:w-1/2 md:h-auto md:rounded-tl-lg md:rounded-bl-lg overflow-hidden bg-[#0a1c2b]">
            <img
              src={Logo}
              alt="Brand Logo"
              className="w-full h-full object-cover"
            />
          </div>

          {/* Right side */}
          <div className="w-full md:w-1/2 p-6 md:p-8 bg-white flex flex-col gap-4 border-[1.5px] border-[#E4E4E9] rounded-lg md:rounded-tl-none md:rounded-bl-none md:rounded-tr-lg md:rounded-br-lg">

            <h2 className="text-2xl md:text-3xl font-medium text-[#2F3037] py-2 text-center">
              Sign In for a ScalePad account
            </h2>

            <h3 className="text-center">
              One toolkit powering modern MSPs
            </h3>

            <div className="flex flex-row flex-wrap justify-center items-center gap-3 mt-2">
              <img src={LifeCycle} alt="Life Cycle" className="h-12 w-12" />
              <img src={Radar} alt="Radar" className="h-12 w-12" />
              <img src={Condition360} alt="Condition 360" className="h-12 w-12" />
              <img src={ControlMap} alt="Control Map" className="h-12 w-12" />
              <img src={Quoter} alt="Map / Quoter" className="h-12 w-12" />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-3 mt-4">

              {/* Email */}
              <Input
                label="Email"
                value={email}
                error={Error.email}
                onChange={(e) => setEmail(e.target.value)}
              />

              {/* Password */}
              <Input
                label="Password"
                type="password"
                value={password}
                error={Error.password}
                onChange={(e) => setPassword(e.target.value)}
              />

              {Error.api && (
                <p className="text-red-500 text-sm text-center">
                  {Error.api}
                </p>
              )}

              <div className="flex items-center gap-3 text-xs text-gray-400 uppercase tracking-wider">
                <span className="flex-1 h-px bg-gray-200" />
                or
                <span className="flex-1 h-px bg-gray-200" />
              </div>

              {googleClientId && originAllowed ? (
                <div className="w-full flex justify-center">
                  <div className="w-full max-w-sm" ref={googleButtonRef} />
                </div>
              ) : (
              <button
                type="button"
                disabled
                className="bg-gray-100 text-gray-400 py-3 rounded-lg w-full text-sm cursor-not-allowed"
              >
                {googleClientId ? "Google login origin not allowed" : "Google login not configured"}
              </button>
            )}

              <h4 className="text-xs text-gray-500 px-1 text-center">
                By signing in, you agree to our{" "}
                <Link to="/terms" className="font-normal">Terms of Service</Link> and Privacy policy.
              </h4>

              <button
                type="submit"
                className="bg-[rgb(5,117,204)] text-white py-3 rounded-lg w-full text-sm font-medium hover:bg-[rgb(0,97,170)] transition-colors"
              >
                Continue
              </button>

              <Link
                to="/signup"
                className="mx-auto text-center text-sm text-[rgb(5,117,204)] hover:bg-blue-50 py-2 w-60 flex justify-center rounded-lg"
              >
                I don't know my credentials
              </Link>

              <Link
                to="/signup"
                className="mx-auto text-center text-sm text-[rgb(5,117,204)] hover:bg-blue-50 py-2 w-60 flex justify-center rounded-lg"
              >
                Sign up for free
              </Link>

            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
