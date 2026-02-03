import React from 'react';
import LifeCycle from '../../assets/icons/LifeCycle.svg';
import { FaGear } from "react-icons/fa6";
import { FaBell } from "react-icons/fa";
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';

const DashboardHeader = () => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div className="fixed top-10 left-0 right-0 z-20 w-full bg-[rgb(37,38,45)] text-white border-t border-t-[rgb(101,101,101)] px-4 py-1">
      {/* Mobile-only row */}
      <div className="flex items-center justify-between md:hidden h-12">
        <div className="flex items-center gap-2">
          <img
            src={LifeCycle}
            alt="Life Cycle"
            className="h-6 w-6 grayscale contrast-400 brightness-60 invert cursor-pointer"
          />
          <h1
            onClick={() => navigate('/clients')}
            className="text-lg font-semibold cursor-pointer whitespace-nowrap tracking-wide"
          >
            Lifecycle Manager
          </h1>
        </div>
        <button
          type="button"
          onClick={handleLogout}
          className="text-xs font-medium text-white/80 hover:text-white border border-white/20 rounded px-2 py-1"
        >
          Logout
        </button>
      </div>

      {/* Desktop row (original layout) */}
      <div className="hidden md:flex justify-between items-center h-12">
        <div className="flex items-center gap-2 flex-wrap">
          <img
            src={LifeCycle}
            alt="Life Cycle"
            className="h-6 w-6 grayscale contrast-400 brightness-60 invert cursor-pointer"
          />

          <h1
            onClick={() => navigate('/clients')}
            className="text-lg font-semibold cursor-pointer whitespace-nowrap tracking-wide"
          >
            Lifecycle Manager
          </h1>

          <div className="flex-1 min-w-0">
            <Navbar />
          </div>
        </div>

        <div className="flex items-center gap-3">
          <FaBell className="text-[rgb(182,183,195)] cursor-pointer text-base" />
          <FaGear className="text-[rgb(182,183,195)] cursor-pointer text-base" />
          <button
            type="button"
            onClick={handleLogout}
            className="text-xs font-medium text-white/80 hover:text-white border border-white/20 rounded px-2 py-1"
          >
            Logout
          </button>
        </div>
      </div>
    </div>
  );
};

export default DashboardHeader;
