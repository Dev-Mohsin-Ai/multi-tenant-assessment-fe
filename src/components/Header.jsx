import React from 'react'
import { IoAppsSharp } from "react-icons/io5";
import HeaderLogo from '../assets/HeaderLogo.png';
import { HiMiniQuestionMarkCircle } from "react-icons/hi2";

const Header = () => {
    return (
        <>
            <div className='bg-black flex justify-between items-center px-4 py-0.5 fixed top-0 w-full z-10'>

                <div className='flex items-center gap-3'>
                    <IoAppsSharp className='text-white h-5 w-5' />

                    <hr className='h-9 border-l border-white/30' />

                    <img src={HeaderLogo} alt="Header Logo" className='h-4' />
                </div>

                <HiMiniQuestionMarkCircle className='text-white h-5 w-5' />

            </div>

            {/* Bottom divider */}
            <hr className='w-full border-t-2 border-white/40' />
        </>
    )
}

export default Header
