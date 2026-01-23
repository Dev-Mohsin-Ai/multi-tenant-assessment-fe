import React, { useState } from 'react'
import LoginLogo from '../assets/LoginLogo.png'
import Logo from '../assets/Logo.png'
import Input from '../components/Input'
import LifeCycle from '../assets/icons/LifeCycle.svg'
import Radar from '../assets/icons/Radar.svg'
import Condition360 from '../assets/icons/Condition360.svg'
import ControlMap from '../assets/icons/ControlMap.svg'
import Quoter from '../assets/icons/Quoter.svg'
import { Link } from 'react-router-dom'

const Login = () => {

    const [Email, SetEmail] = useState("")
    const [Error, setError] = useState({})
    const handleSubmit = (e) => {
        e.preventDefault()
        console.log("Email:", Email);

        let newErrors = {};

        if (!Email) {
            newErrors.Email = "Email is required";
            setError(newErrors)
            return;
        }

    }

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
                    <div className="w-full md:w-1/2 h-56 md:h-auto rounded-tl-lg md:rounded-tl-lg md:rounded-bl-lg overflow-hidden bg-[#0a1c2b]">
                        <img
                            src={Logo}
                            alt="Brand Logo"
                            className="w-full h-full object-cover"
                        />
                    </div>

                    {/* Right side */}
                    <div className="w-full md:w-1/2 p-6 md:p-8 bg-white flex flex-col gap-4 border-[1.5px] border-[#E4E4E9] rounded-bl-lg md:rounded-bl-none rounded-tr-lg md:rounded-tr-lg rounded-br-lg">

                        <h2 className="text-2xl md:text-3xl font-medium text-[#2F3037] py-2 text-center flex justify-center items-center">
                            Sign In for a ScalePad account
                        </h2>

                        <h3 className="text-center">
                            One toolkit powering modern MSPs
                        </h3>

                        <div className="flex flex-col md:flex-row justify-center items-center gap-4 mt-2">
                            <img src={LifeCycle} alt="Life Cycle" className="h-12 w-12" />
                            <img src={Radar} alt="Radar" className="h-12 w-12" />
                            <img src={Condition360} alt="Condition 360" className="h-12 w-12" />
                            <img src={ControlMap} alt="Control Map" className="h-12 w-12" />
                            <img src={Quoter} alt="Map / Quoter" className="h-12 w-12" />
                        </div>

                        <form
                            onSubmit={(e) => {
                                handleSubmit(e)
                            }}
                            className="flex flex-col gap-3 mt-4">
                            <Input
                                label={"Or continue with email"}
                                value={Email}
                                error={Error.Email}
                                onChange={(e) => {
                                    SetEmail(e.target.value)
                                }}
                            />

                            <h4 className="text-xs text-gray-500 px-1 text-center">
                                By signing in, you agree to our{" "}
                                <Link to="/terms" className="font-normal">Terms of Service</Link> and Privacy policy.
                            </h4>

                            <button
                                type='submit'
                                className="bg-[#4E6ED0] text-white py-3 rounded-xl w-full text-sm hover:bg-[#3b57a1] transition-colors">
                                Continue
                            </button>

                            {/* Centered Link 1 */}
                            <Link
                                to="/signup"
                                className="mx-auto text-center text-sm text-[#4E6ED0] hover:bg-[#e6ebfb] py-2 w-60 flex justify-center rounded-lg"
                            >
                                I don't know my credentials
                            </Link>

                            {/* Centered Link 2 */}
                            <Link
                                to="/signup"
                                className="mx-auto text-center text-sm text-[#4E6ED0] hover:bg-[#e6ebfb] py-2 w-60 flex justify-center rounded-lg"
                            >
                                Sign up for free
                            </Link>
                        </form>

                    </div>

                </div>

            </div>

        </div>
    )
}

export default Login

