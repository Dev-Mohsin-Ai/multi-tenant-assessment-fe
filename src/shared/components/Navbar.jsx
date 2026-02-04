import React from 'react'
import Home from '../../assets/icons/Home.svg'
import Assets from '../../assets/icons/Assets.svg'
import Strategy from '../../assets/icons/Strategy.svg'
import Marketplace from '../../assets/icons/Marketplace.svg'
import { FaChevronDown } from 'react-icons/fa'
import { Link } from 'react-router-dom'

const Navbar = () => {
    return (
        <div className="px-6 py-3 text-sm">
            <div className="flex gap-8 text-[rgb(182,183,195)]">

                {/* Home */}
                <Link to="/clients/select" className="flex items-center gap-2 hover:text-white">
                    <img src={Home} alt="Home" className="h-4 w-4" />
                    <span>Home</span>
                    <FaChevronDown className="text-xs" />
                </Link>

                {/* Assets */}
                <Link to="/clients/select" className="flex items-center gap-2 hover:text-white">
                    <img src={Assets} alt="Assets" className="h-4 w-4" />
                    <span>Assets</span>
                    <FaChevronDown className="text-xs" />
                </Link>

                {/* Strategy */}
                <Link to="/clients/select" className="flex items-center gap-2 hover:text-white">
                    <img src={Strategy} alt="Strategy" className="h-4 w-4" />
                    <span>Strategy</span>
                    <FaChevronDown className="text-xs" />
                </Link>

                {/* Marketplace */}
                <Link to="/clients/select" className="flex items-center gap-2 hover:text-white">
                    <img src={Marketplace} alt="Marketplace" className="h-4 w-4" />
                    <span>Marketplace</span>
                    <FaChevronDown className="text-xs" />
                </Link>

            </div>
        </div>
    )
}

export default Navbar
