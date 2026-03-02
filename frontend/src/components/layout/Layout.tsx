import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";
import MobileNav from "./MobileNav";
import { useState } from "react";

function Layout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [theme, setTheme] = useState("dark");

  const toggleTheme = (t: string) => {
    setTheme(t);
    document.documentElement.setAttribute("data-theme", t);
  };

  return (
    <div
      data-theme={theme}
      style={{ background: "var(--bg)", minHeight: "100vh" }}
    >
      {/* Overlay for mobile */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-[99] bg-black/50 backdrop-blur-sm"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Everything to the right of sidebar */}
      <div
        className="flex flex-col min-h-screen"
        style={{ marginLeft: "0", transition: "margin .28s" }}
      >
        <style>{`
          @media (min-width: 900px) {
            .main-content-area {
              margin-left: 240px;
            }
          }
        `}</style>

        <div className="main-content-area flex flex-col min-h-screen">
          <Header
            onMenuClick={() => setSidebarOpen(true)}
            theme={theme}
            onThemeChange={toggleTheme}
          />

          {/* Page content */}
          <main
            className="flex-1"
            style={{
              padding: "22px",
              paddingBottom: "88px",
              overflowX: "hidden",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <Outlet />
          </main>

          <MobileNav />
        </div>
      </div>
    </div>
  );
}

export default Layout;
