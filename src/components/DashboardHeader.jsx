import React from 'react';
import LifeCycle from '../assets/icons/LifeCycle.svg';
import TreeDeciduous from '../assets/icons/TreeDeciduous.svg';
import { FaGear } from "react-icons/fa6";
import { FaBell, FaRegStar, FaSearch } from "react-icons/fa";
import Navbar from './Navbar';
import { useNavigate } from 'react-router-dom';

const DashboardHeader = () => {
  const navigate = useNavigate();
  const handleLogout = () => {
    localStorage.removeItem('token')
    navigate('/login')
  }

  return (
    <div className="fixed top-10 left-0 right-0 z-20 h-12 w-full bg-[rgb(37,38,45)] text-white border-t border-t-[rgb(101,101,101)] px-4 py-0.5 flex justify-between items-center">
      <div className="flex items-center gap-2 flex-wrap">
        <img
          src={LifeCycle}
          alt="Life Cycle"
          className="h-6 w-6 grayscale contrast-400 brightness-60 invert cursor-pointer"
        />

        <h1
          onClick={() => navigate('/clients')}
          className="text-lg font-bold cursor-pointer whitespace-nowrap tracking-wide"
        >
          Lifecycle Manager
        </h1>

        <div className="flex-1 min-w-0">
          <Navbar />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative">
          <FaSearch className="absolute left-2 top-1/2 -translate-y-1/2 text-[rgb(182,183,195)] text-xs" />
          <input
            type="search"
            placeholder="Search clients"
            className="border border-gray-300 bg-[rgb(86,87,93)] text-[rgb(222,222,226)] pl-7 pr-2 py-0.5 rounded outline-none text-sm"
          />
        </div>

        <button
          type="button"
          className="flex items-center gap-1.5 px-3 py-0.5 rounded text-white text-sm font-medium"
          style={{
            background:
              "linear-gradient(90deg, rgb(0, 107, 191) 0%, rgb(91, 164, 221) 16%, rgb(175, 220, 255) 37%, rgb(134, 191, 235) 48%, rgb(92, 128, 211) 58%, rgb(140, 86, 211) 69%, rgb(196, 77, 219) 83%, rgb(0, 89, 158) 100%) 1% 50% / 559.71%",
          }}
        >
          <FaRegStar className="p-0.5 text-xs border-white border rounded-2xl" />
          Manage plans
        </button>

        <div className="flex items-center gap-1">
          <h1 className="text-[rgb(97,201,80)] font-medium text-sm">4</h1>
          <img src={TreeDeciduous} alt="Tree" className="h-4 w-4" />
        </div>

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
  );
};

export default DashboardHeader;
