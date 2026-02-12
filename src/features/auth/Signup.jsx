import { useState } from 'react'
import LoginLogo from '../../assets/LoginLogo.png'
import Input from '../../shared/components/Input'
import { Link } from 'react-router-dom'
import { FaUsers } from 'react-icons/fa6'
import { MdAssessment } from 'react-icons/md'
import { SiRoadmapdotsh } from 'react-icons/si'
import { FiTarget } from 'react-icons/fi'
import { HiTemplate } from 'react-icons/hi'

const Signup = () => {
    const [Company, setCompany] = useState("")
    const [FirstName, setFirstName] = useState("")
    const [LastName, setLastName] = useState("")
    const [CompanyEmail, setCompanyEmail] = useState("")
    const [Phone, setPhone] = useState("")
    const [Error, setError] = useState({})

    const handleSubmit = (e) => {
        e.preventDefault()
        const data = {
            company: Company,
            firstName: FirstName,
            lastName: LastName,
            email: CompanyEmail,
            phone: Phone,
        }

        let newErrors = {};

        if (!Company) {
            newErrors.Company = "You must enter your your company's name";
        }

        if (!FirstName) {
            newErrors.FirstName = "You must enter your full name";
        }

        if (!LastName) {
            newErrors.LastName = "You must enter your full name";
        }

        if (!CompanyEmail) {
            newErrors.CompanyEmail = "You can't leave this empty";
        }

        if (Object.keys(newErrors).length > 0) {
            setError(newErrors)
            return;
        }

        console.log(data)
    }

    return (
        <div className="bg-[#F8F8FC] flex flex-col min-h-screen pb-10">

            {/* Top Logo */}
            <div className="flex items-center justify-center mt-12 md:mt-16">
                <img src={LoginLogo} alt="Login Logo" className="h-12 md:h-16" />
            </div>

            {/* Main Container */}
            <div className="flex flex-col md:flex-row justify-center items-stretch mx-auto max-w-5xl w-full mt-6 px-4 md:px-0">

                {/* Right side */}
                <div className="w-full max-w-xl mx-auto p-6 md:p-8 bg-white flex flex-col justify-center border-[1.5px] border-[#E4E4E9] rounded-lg">

                    <h2 className="text-2xl md:text-3xl font-medium text-[#2F3037] mb-2 text-center py-3">
                        Sign up for an Atlas account
                    </h2>

                    <div className="flex flex-row flex-wrap justify-center items-center gap-4 mt-2 mb-4 text-[rgb(5,117,204)]">
                        <FaUsers className="h-10 w-10" aria-label="Clients" title="Clients" />
                        <MdAssessment className="h-10 w-10" aria-label="Assessments" title="Assessments" />
                        <SiRoadmapdotsh className="h-10 w-10" aria-label="Roadmap" title="Roadmap" />
                        <FiTarget className="h-10 w-10" aria-label="Goals" title="Goals" />
                        <HiTemplate className="h-10 w-10" aria-label="Templates" title="Templates" />
                    </div>

                    <hr className="border-[#E4E4E9] mb-6" />

                    {/* Form */}
                    <form
                        onSubmit={(e) => {
                            handleSubmit(e);
                        }}
                        className="space-y-4">

                        <Input
                            label="Your company's name"
                            type="text"
                            error={Error.Company}
                            value={Company}
                            onChange={(e) => {
                                setCompany(e.target.value)
                            }}
                        />

                        <Input
                            label="First name"
                            type="text"
                            error={Error.FirstName}
                            value={FirstName}
                            onChange={(e) => {
                                setFirstName(e.target.value)
                            }}
                        />

                        <Input
                            label="Last name"
                            type="text"
                            error={Error.LastName}
                            value={LastName}
                            onChange={(e) => {
                                setLastName(e.target.value)
                            }}
                        />

                        <Input
                            label="Company email"
                            type="email"
                            error={Error.CompanyEmail}
                            value={CompanyEmail}
                            onChange={(e) => {
                                setCompanyEmail(e.target.value)
                            }}
                        />

                        <Input
                            label="Phone number"
                            text="(optional)"
                            type="tel"
                            value={Phone}
                            onChange={(e) => {
                                setPhone(e.target.value)
                            }}
                        />

                        <label className="flex gap-3 text-sm px-3">
                            <input type="checkbox" />
                            <span>
                                Join our mailing list to receive the must-know articles & information that help thousands of MSPs add value for their clients.
                            </span>
                        </label>

                        <h4 className="text-xs text-gray-500 mt-2 px-1">
                            By signing up for an account, you agree to our{" "}
                            <a href="/terms" className="font-normal">Terms of Service</a> and Privacy policy.
                        </h4>

                        <button
                            type='submit'
                            className="bg-[rgb(5,117,204)] text-white py-2 rounded-lg w-full mt-2 text-sm font-medium hover:bg-[rgb(0,97,170)] transition-colors">
                            Create Account
                        </button>

                        <Link
                            to="/login"
                            className="inline-flex items-center justify-center rounded-lg w-full mt-2 py-2 text-sm font-medium border border-gray-200 text-gray-700 hover:bg-gray-50 transition-colors"
                        >
                            Back to Sign In
                        </Link>

                    </form>

                </div>

            </div>

        </div>
    )
}

export default Signup

