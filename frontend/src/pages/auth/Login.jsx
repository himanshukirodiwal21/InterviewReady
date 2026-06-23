// src/pages/auth/Login.jsx
import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  Mail,
  Lock,
  UserCircle,
  User,
  CheckCircle,
  Eye,
  EyeOff,
  Shield,
} from "lucide-react";
import api from "../../services/api";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();

  const location = useLocation(); // get state from router
  const initialForm = location.state?.form || "login"; // default login
  const [currentPage, setCurrentPage] = useState(initialForm);

  const [step, setStep] = useState(1);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    fullName: "",
    username: "",
    email: "",
    password: "",
    otp: "",
  });
  const [loginData, setLoginData] = useState({ email: "", password: "" });
  const [adminLoginData, setAdminLoginData] = useState({
    email: "",
    password: "",
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if user already logged in
  useEffect(() => {
    const currentUser = localStorage.getItem("currentUser");
    if (currentUser) {
      const user = JSON.parse(currentUser);
      if (user.role === "admin") {
        navigate("/", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  }, [navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleLoginChange = (e) => {
    const { name, value } = e.target;
    setLoginData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const handleAdminLoginChange = (e) => {
    const { name, value } = e.target;
    setAdminLoginData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) setErrors((prev) => ({ ...prev, [name]: "" }));
  };

  const validateStep1 = () => {
    const newErrors = {};
    if (!formData.fullName.trim()) newErrors.fullName = "Full name is required";
    if (!formData.username.trim()) newErrors.username = "Username is required";
    else if (formData.username.length < 3)
      newErrors.username = "Username must be at least 3 characters";
    if (!formData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(formData.email))
      newErrors.email = "Email is invalid";
    if (!formData.password) newErrors.password = "Password is required";
    else if (formData.password.length < 6)
      newErrors.password = "Password must be at least 6 characters";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateLogin = () => {
    const newErrors = {};
    if (!loginData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(loginData.email))
      newErrors.email = "Email is invalid";
    if (!loginData.password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateAdminLogin = () => {
    const newErrors = {};
    if (!adminLoginData.email.trim()) newErrors.email = "Email is required";
    else if (!/\S+@\S+\.\S+/.test(adminLoginData.email))
      newErrors.email = "Email is invalid";
    if (!adminLoginData.password) newErrors.password = "Password is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateLogin()) return;
    setIsSubmitting(true);

    try {
      // correct endpoint + data
      const res = await api.post("/users/login", loginData);

      // axios response data
      const data = res.data;

      const userData = {
        id: data.data.user._id || data.data.user.id,
        fullName: data.data.user.fullName,
        username: data.data.user.username,
        email: data.data.user.email,
        role: "user",
      };

      localStorage.setItem("currentUser", JSON.stringify(userData));
      alert("Login successful: " + loginData.email);
      navigate("/", { replace: true });
    } catch (err) {
  console.log("FULL ERROR:", err);
  console.log("RESPONSE:", err.response);
  console.log("DATA:", err.response?.data);

  alert(
    err.response?.data?.message ||
    err.message ||
    "Login failed"
  );
} finally {
      setIsSubmitting(false);
    }
  };

  const handleAdminLogin = async () => {
    if (!validateAdminLogin()) return;
    setIsSubmitting(true);
    try {
      const res = await api.post("/api/v1/admin/login", adminLoginData);

      if (res.status === 200) {
        const adminData = {
          id: res.data.data.admin._id || res.data.data.admin.id,
          fullName: res.data.data.admin.fullName,
          email: res.data.data.admin.email,
          role: "admin",
        };
        localStorage.setItem("currentUser", JSON.stringify(adminData));
        alert("Admin login successful: " + adminLoginData.email);
        navigate("/", { replace: true });
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Admin login failed");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSendOTP = async () => {
    if (!validateStep1()) return;
    setIsSubmitting(true);
    try {
      const res = await api.post("/api/v1/users/register", {
        fullName: formData.fullName,
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      // Axios automatically throws on error status, so if we're here, it succeeded
      if (res.status === 200 || res.status === 201) {
        setStep(2);
        setFormData((prev) => ({ ...prev, otp: "" }));
        alert(res.data?.message || "OTP sent to " + formData.email);
      }
    } catch (err) {
      console.error(err);
      if (err.response?.status === 409) {
        alert(err.response.data?.message || "User already exists. Please login.");
      } else {
        alert(err.response?.data?.message || "Registration failed");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!formData.otp.trim()) {
      setErrors({ otp: "Please enter OTP" });
      return;
    }
    if (formData.otp.length !== 6) {
      setErrors({ otp: "OTP must be 6 digits" });
      return;
    }
    setIsSubmitting(true);
    try {
      const res = await api.post("/api/v1/users/verifyemail", {
        email: formData.email,
        code: formData.otp,
      });

      // Check status properly
      if (res.status === 200) {
        setStep(3);
      }
    } catch (err) {
      console.error(err);
      setErrors({ otp: err.response?.data?.message || "OTP verification failed" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendOTP = async () => {
    setIsSubmitting(true);
    try {
      const res = await api.post("/api/v1/users/resend-otp", {
        email: formData.email,
      });

      // Properly check status
      if (res.status === 200) {
        setFormData((prev) => ({ ...prev, otp: "" }));
        alert(res.data?.message || "OTP resent to " + formData.email);
      }
    } catch (err) {
      console.error(err);
      alert(err.response?.data?.message || "Failed to resend OTP");
    } finally {
      setIsSubmitting(false);
    }
  };

  const switchToSignup = () => {
    setCurrentPage("signup");
    setStep(1);
    setErrors({});
    setLoginData({ email: "", password: "" });
  };

  const switchToLogin = () => {
    setCurrentPage("login");
    setStep(1);
    setErrors({});
    setFormData({
      fullName: "",
      username: "",
      email: "",
      password: "",
      otp: "",
    });
  };

  const switchToAdminLogin = () => {
    setCurrentPage("adminLogin");
    setErrors({});
    setAdminLoginData({ email: "", password: "" });
  };

  const switchBackToUserLogin = () => {
    setCurrentPage("login");
    setErrors({});
    setAdminLoginData({ email: "", password: "" });
  };

  const handleKeyPress = (e, action) => {
    if (e.key === "Enter") action();
  };

  return (
    <div className="ir-auth">
      <div className="ir-auth__card">
        {currentPage !== "adminLogin" && (
          <div className="ir-auth__tabs">
            <button
              className={`ir-auth__tab ${
                currentPage === "login" ? "ir-auth__tab--active" : ""
              }`}
              onClick={switchToLogin}
            >
              Login
            </button>
            <button
              className={`ir-auth__tab ${
                currentPage === "signup" ? "ir-auth__tab--active" : ""
              }`}
              onClick={switchToSignup}
            >
              Sign Up
            </button>
          </div>
        )}

        {currentPage === "adminLogin" && (
          <div>
            <div className="ir-auth__admin-head">
              <div className="ir-auth__admin-icon">
                <Shield size={28} color="var(--ir-paper)" />
              </div>
              <h2 className="ir-auth__admin-title">Admin Login</h2>
              <p className="ir-auth__admin-subtext">Access admin dashboard</p>
            </div>

            <div className="ir-auth__field">
              <label className="ir-auth__label">Admin Email</label>
              <Mail size={18} className="ir-auth__input-icon" />
              <input
                type="email"
                name="email"
                value={adminLoginData.email}
                onChange={handleAdminLoginChange}
                onKeyPress={(e) => handleKeyPress(e, handleAdminLogin)}
                className="ir-auth__input ir-auth__input--with-icon"
                placeholder="Enter admin email"
              />
              {errors.email && <div className="ir-auth__error">{errors.email}</div>}
            </div>

            <div className="ir-auth__field">
              <label className="ir-auth__label">Admin Password</label>
              <Lock size={18} className="ir-auth__input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={adminLoginData.password}
                onChange={handleAdminLoginChange}
                onKeyPress={(e) => handleKeyPress(e, handleAdminLogin)}
                className="ir-auth__input ir-auth__input--with-icon"
                placeholder="Enter admin password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="ir-auth__toggle-visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {errors.password && (
                <div className="ir-auth__error">{errors.password}</div>
              )}
            </div>

            <button
              onClick={handleAdminLogin}
              disabled={isSubmitting}
              className="ir-auth__button ir-auth__button--admin"
            >
              <Shield size={17} />
              {isSubmitting ? "Logging in..." : "Login as Admin"}
            </button>

            <button onClick={switchBackToUserLogin} className="ir-auth__button ir-auth__button--ghost">
              ← Back to User Login
            </button>
          </div>
        )}

        {currentPage === "login" && (
          <div>
            <h2 className="ir-auth__heading">Welcome Back</h2>

            <div className="ir-auth__field">
              <label className="ir-auth__label">Email</label>
              <Mail size={18} className="ir-auth__input-icon" />
              <input
                type="email"
                name="email"
                value={loginData.email}
                onChange={handleLoginChange}
                onKeyPress={(e) => handleKeyPress(e, handleLogin)}
                className="ir-auth__input ir-auth__input--with-icon"
                placeholder="Enter email"
              />
              {errors.email && <div className="ir-auth__error">{errors.email}</div>}
            </div>

            <div className="ir-auth__field">
              <label className="ir-auth__label">Password</label>
              <Lock size={18} className="ir-auth__input-icon" />
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                value={loginData.password}
                onChange={handleLoginChange}
                onKeyPress={(e) => handleKeyPress(e, handleLogin)}
                className="ir-auth__input ir-auth__input--with-icon"
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="ir-auth__toggle-visibility"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              {errors.password && (
                <div className="ir-auth__error">{errors.password}</div>
              )}
            </div>

            <div className="ir-auth__forgot-row">
              <a href="/forgot-password" className="ir-auth__forgot-link">
                Forgot Password?
              </a>
            </div>

            <button
              onClick={handleLogin}
              disabled={isSubmitting}
              className="ir-auth__button"
            >
              {isSubmitting ? "Logging in..." : "Login"}
            </button>

            <div className="ir-auth__divider">
              <div className="ir-auth__divider-line" />
              <span>or</span>
              <div className="ir-auth__divider-line" />
            </div>

            <button onClick={switchToAdminLogin} className="ir-auth__button ir-auth__button--admin">
              <Shield size={18} />
              Login as Admin
            </button>
          </div>
        )}

        {currentPage === "signup" && (
          <div>
            <div className="ir-auth__steps">
              <div className={`ir-auth__step-circle ${step >= 1 ? "ir-auth__step-circle--active" : ""}`}>
                1
              </div>
              <div className={`ir-auth__step-line ${step >= 2 ? "ir-auth__step-line--active" : ""}`} />
              <div className={`ir-auth__step-circle ${step >= 2 ? "ir-auth__step-circle--active" : ""}`}>
                2
              </div>
              <div className={`ir-auth__step-line ${step >= 3 ? "ir-auth__step-line--active" : ""}`} />
              <div className={`ir-auth__step-circle ${step >= 3 ? "ir-auth__step-circle--active" : ""}`}>
                3
              </div>
            </div>

            {step === 1 && (
              <>
                <div className="ir-auth__field">
                  <label className="ir-auth__label">Full Name</label>
                  <UserCircle size={18} className="ir-auth__input-icon" />
                  <input
                    type="text"
                    name="fullName"
                    value={formData.fullName}
                    onChange={handleChange}
                    onKeyPress={(e) => handleKeyPress(e, handleSendOTP)}
                    className="ir-auth__input ir-auth__input--with-icon"
                    placeholder="Enter full name"
                  />
                  {errors.fullName && (
                    <div className="ir-auth__error">{errors.fullName}</div>
                  )}
                </div>

                <div className="ir-auth__field">
                  <label className="ir-auth__label">Username</label>
                  <User size={18} className="ir-auth__input-icon" />
                  <input
                    type="text"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    onKeyPress={(e) => handleKeyPress(e, handleSendOTP)}
                    className="ir-auth__input ir-auth__input--with-icon"
                    placeholder="Choose username"
                  />
                  {errors.username && (
                    <div className="ir-auth__error">{errors.username}</div>
                  )}
                </div>

                <div className="ir-auth__field">
                  <label className="ir-auth__label">Email</label>
                  <Mail size={18} className="ir-auth__input-icon" />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    onKeyPress={(e) => handleKeyPress(e, handleSendOTP)}
                    className="ir-auth__input ir-auth__input--with-icon"
                    placeholder="Enter email"
                  />
                  {errors.email && (
                    <div className="ir-auth__error">{errors.email}</div>
                  )}
                </div>

                <div className="ir-auth__field">
                  <label className="ir-auth__label">Password</label>
                  <Lock size={18} className="ir-auth__input-icon" />
                  <input
                    type={showPassword ? "text" : "password"}
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    onKeyPress={(e) => handleKeyPress(e, handleSendOTP)}
                    className="ir-auth__input ir-auth__input--with-icon"
                    placeholder="Enter password"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="ir-auth__toggle-visibility"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                  {errors.password && (
                    <div className="ir-auth__error">{errors.password}</div>
                  )}
                </div>

                <button
                  onClick={handleSendOTP}
                  disabled={isSubmitting}
                  className="ir-auth__button"
                >
                  {isSubmitting ? "Sending OTP..." : "Send OTP"}
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <p className="ir-auth__otp-sent">
                  OTP sent to <strong>{formData.email}</strong>
                </p>

                <div className="ir-auth__field">
                  <label className="ir-auth__label">Enter OTP</label>
                  <input
                    type="text"
                    name="otp"
                    value={formData.otp}
                    onChange={handleChange}
                    maxLength="6"
                    onKeyPress={(e) => handleKeyPress(e, handleVerifyOTP)}
                    className="ir-auth__input ir-auth__input--otp"
                    placeholder="000000"
                  />
                  {errors.otp && <div className="ir-auth__error">{errors.otp}</div>}
                </div>

                <button
                  onClick={handleVerifyOTP}
                  disabled={isSubmitting}
                  className="ir-auth__button"
                >
                  {isSubmitting ? "Verifying..." : "Verify OTP"}
                </button>

                <button
                  onClick={handleResendOTP}
                  disabled={isSubmitting}
                  className="ir-auth__button ir-auth__button--ghost"
                >
                  {isSubmitting ? "Resending..." : "Resend OTP"}
                </button>

                <button
                  onClick={() => setStep(1)}
                  className="ir-auth__button ir-auth__button--text"
                >
                  ← Back to edit details
                </button>
              </>
            )}

            {step === 3 && (
              <div className="ir-auth__success">
                <CheckCircle size={56} className="ir-auth__success-icon" />
                <h2 className="ir-auth__success-heading">Account Created!</h2>

                <div className="ir-auth__success-box">
                  <p className="ir-auth__success-row">
                    <strong>Name:</strong> {formData.fullName}
                  </p>
                  <p className="ir-auth__success-row">
                    <strong>Username:</strong> {formData.username}
                  </p>
                  <p className="ir-auth__success-row">
                    <strong>Email:</strong> {formData.email}
                  </p>
                </div>

                <button onClick={switchToLogin} className="ir-auth__button">
                  Go to Login
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}