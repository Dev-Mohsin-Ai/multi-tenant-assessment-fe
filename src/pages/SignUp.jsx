import React from 'react'
import LoginLogo from '../assets/LoginLogo.png';
import Logo from '../assets/Logo.png';

const SignUp = () => {
    return (
        <div>
            <div className='flex items-center justify-center mt-16 mb-0'>
                <img src={LoginLogo} alt="Login Logo" className='h-16' />
            </div>

            <div className='flex flex-col md:flex-row justify-center items-center mx-auto max-w-5xl h-screen'>

                {/* Left side */}
                <div className='w-full md:w-1/2 rounded-tl-lg rounded-bl-lg overflow-hidden bg-[#0a1c2b] flex justify-center items-center'>
                    <img src={Logo} alt="Brand Logo" className='w-full h-auto object-contain' />
                </div>

                {/* Right side */}
                <div className='w-full md:w-1/2 p-6'>
                    vev
                </div>

            </div>
        </div>
    )
}

export default SignUp
