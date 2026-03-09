import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) {
      setError("Please enter email and password");
      return;
    }
    setError("");
    setIsLoading(true);
    try {
      await login(email, password);
      navigate("/dashboard");
    } catch (err: any) {
      setError(err.message || "Login failed");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      data-theme="dark"
      className="min-h-screen flex items-center justify-center px-4"
      style={{
        background: "var(--bg)",
        backgroundImage: `
      radial-gradient(ellipse 600px 400px at 70% 10%, var(--grad1) 0%, transparent 70%),
      radial-gradient(ellipse 400px 300px at 10% 80%, var(--grad2) 0%, transparent 60%)
    `,
      }}
    >
      <div className="w-full max-w-[400px]">
        {/* Brand */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <img
            src="/logo.png"
            alt="SRC Electric"
            className="h-[60px] w-auto object-contain"
          />
        </div>

        {/* Card */}
        <div className="card p-[28px]">
          {/* Title */}
          <div className="mb-[24px]">
            <div
              className="font-inter font-extrabold text-[22px] mb-1"
              style={{ color: "var(--text-primary)" }}
            >
              Welcome back
            </div>
            <div
              className="text-[13px]"
              style={{ color: "var(--text-secondary)" }}
            >
              Sign in to your account to continue
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              className="p-[10px_13px] rounded-lg mb-[16px] text-[12px] font-inter"
              style={{
                background: "rgba(255,77,106,.1)",
                border: "1px solid rgba(255,77,106,.2)",
                color: "#ff4d6a",
              }}
            >
              {error}
            </div>
          )}

          {/* Email */}
          <div className="mb-[13px]">
            <label
              className="block text-[10px] uppercase tracking-[.1em] mb-[6px] font-inter font-semibold"
              style={{ color: "var(--text-secondary)" }}
            >
              Email
            </label>
            <input
              className="fi"
              type="email"
              placeholder="admin@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          {/* Password */}
          <div className="mb-[20px]">
            <label
              className="block text-[10px] uppercase tracking-[.1em] mb-[6px] font-inter font-semibold"
              style={{ color: "var(--text-secondary)" }}
            >
              Password
            </label>
            <input
              className="fi"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleLogin()}
            />
          </div>

          {/* Button */}
          <button
            className="btn btn-primary w-full justify-center"
            onClick={handleLogin}
            disabled={isLoading}
            style={{ opacity: isLoading ? 0.7 : 1 }}
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </div>

        {/* Footer */}
        <div
          className="text-center mt-4 text-[11px]"
          style={{ color: "var(--text-muted)" }}
        >
          SRC Electric — Record System v1.0
        </div>
      </div>
    </div>
  );
}

export default Login;
