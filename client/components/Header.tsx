import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { Menu, X, LogOut } from "lucide-react";
import {
  HomeIcon,
  UploadIcon,
  SettingsIcon,
  SearchAltIcon,
} from "@/components/Icons";
import { useAuthContext } from "@/contexts/AuthContext";

export default function Header() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { isAuthenticated, logout } = useAuthContext();
  const navigate = useNavigate();

  const closeSidebar = () => setIsSidebarOpen(false);

  const handleLogout = async () => {
    await logout();
    closeSidebar();
    navigate("/");
  };

  return (
    <header className="w-full bg-gradient-to-r from-gray-950 to-gray-900 backdrop-blur-md border-b border-gray-700 shadow-lg animate-fadeIn sticky top-0 z-40">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center justify-between">
        <Link
          to="/"
          className="flex items-center gap-2 sm:gap-3 hover:opacity-90 transition-opacity flex-shrink-0"
        >
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full overflow-hidden shadow-md flex-shrink-0">
            <img
              src="https://i.ibb.co/rG8yDddq/doxingdotlifelogogeniune888175141.png"
              alt="Doxing Dot Life Logo"
              className="w-full h-full object-cover"
            />
          </div>
          <span className="font-black text-base sm:text-lg text-white hidden xs:inline line-clamp-1">
            Doxing Dot Life
          </span>
          <span className="font-black text-base sm:text-lg text-white xs:hidden">DDL</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-6 xl:gap-8">
          <Link
            to="/"
            className="flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors duration-200"
          >
            <HomeIcon className="w-4 h-4 sm:w-5 sm:h-5" />
            <span className="hidden xl:inline">Home</span>
          </Link>
          <Link
            to="/all-posts"
            className="text-sm font-semibold text-gray-300 hover:text-white transition-colors duration-200"
          >
            Posts
          </Link>
          <Link
            to="/dox-anyone"
            className="flex items-center gap-2 px-4 py-2 bg-gray-700 text-white font-semibold rounded-lg hover:bg-gray-600 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            <SearchAltIcon className="w-4 h-4" />
            <span>Search</span>
          </Link>
          {isAuthenticated && (
            <>
              <Link
                to="/uppostpanel"
                className="flex items-center gap-2 text-sm font-semibold text-gray-300 hover:text-white transition-colors duration-200"
              >
                <UploadIcon className="w-4 h-4" />
                <span className="hidden xl:inline">Upload</span>
              </Link>
              <Link
                to="/admin-panel"
                className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-500 transition-all duration-200"
              >
                <SettingsIcon className="w-4 h-4" />
                <span className="hidden xl:inline">Admin</span>
              </Link>
              <button
                onClick={handleLogout}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white font-semibold rounded-lg hover:bg-gray-400 transition-all duration-200"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden xl:inline">Logout</span>
              </button>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <button
          className="lg:hidden p-2 hover:bg-slate-700/50 rounded-lg transition-all duration-200 z-50"
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          aria-label="Toggle navigation menu"
        >
          {isSidebarOpen ? (
            <X className="w-6 h-6 text-white" />
          ) : (
            <Menu className="w-6 h-6 text-white" />
          )}
        </button>

        {/* Mobile Sidebar Navigation */}
        {isSidebarOpen && (
          <>
            {/* Overlay */}
            <div
              className="fixed inset-0 bg-black/60 z-30 lg:hidden"
              onClick={closeSidebar}
            />

            {/* Sidebar */}
            <div className="fixed left-0 top-16 bottom-0 w-64 sm:w-72 bg-gradient-to-b from-slate-800 to-slate-900 border-r border-blue-500/30 lg:hidden z-40 animate-slideInLeft shadow-2xl flex flex-col">
              <nav className="p-4 space-y-2 overflow-y-auto flex-1">
                <Link
                  to="/"
                  onClick={closeSidebar}
                  className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 font-semibold hover:bg-blue-600/20 hover:text-white rounded-lg transition-all duration-200"
                >
                  <HomeIcon className="w-5 h-5 flex-shrink-0" />
                  <span>Home</span>
                </Link>
                <Link
                  to="/all-posts"
                  onClick={closeSidebar}
                  className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 font-semibold hover:bg-blue-600/20 hover:text-white rounded-lg transition-all duration-200"
                >
                  <span className="text-lg">📋</span>
                  <span>All Posts</span>
                </Link>
                <Link
                  to="/dox-anyone"
                  onClick={closeSidebar}
                  className="flex items-center gap-3 w-full px-4 py-3 text-white font-semibold hover:bg-blue-600 rounded-lg transition-all duration-200 bg-blue-600/30"
                >
                  <SearchAltIcon className="w-5 h-5 flex-shrink-0" />
                  <span>Dox Anyone</span>
                </Link>
                {isAuthenticated && (
                  <>
                    <div className="my-2 border-t border-slate-700" />
                    <Link
                      to="/uppostpanel"
                      onClick={closeSidebar}
                      className="flex items-center gap-3 w-full px-4 py-3 text-gray-300 font-semibold hover:bg-blue-600/20 hover:text-white rounded-lg transition-all duration-200"
                    >
                      <UploadIcon className="w-5 h-5 flex-shrink-0" />
                      <span>Upload Post</span>
                    </Link>
                    <Link
                      to="/admin-panel"
                      onClick={closeSidebar}
                      className="flex items-center gap-3 w-full px-4 py-3 text-white font-semibold hover:bg-yellow-600/40 rounded-lg transition-all duration-200 bg-yellow-600/20"
                    >
                      <SettingsIcon className="w-5 h-5 flex-shrink-0" />
                      <span>Admin Panel</span>
                    </Link>
                  </>
                )}
              </nav>
              {isAuthenticated && (
                <div className="p-4 border-t border-slate-700">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-red-600 to-red-700 text-white font-semibold rounded-lg hover:from-red-700 hover:to-red-800 transition-all duration-200 shadow-md"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                  </button>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </header>
  );
}
