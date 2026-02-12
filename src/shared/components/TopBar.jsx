import React, { useState } from 'react'
import { IoMdStarOutline } from "react-icons/io"
import { FaChevronDown } from 'react-icons/fa'
import { IoIosInformationCircle } from "react-icons/io";

const TopBar = ({ activeLabel, clientName = 'Mia Labs' }) => {
    const [hoverInfo, setHoverInfo] = useState(false);

    const HandleMouseEnter = () => {
        setHoverInfo(true)
    }
    const HandleMouseLeave = () => {
        setHoverInfo(false)
    }
    return (
        <div className="w-full px-4 md:px-6 pt-4 pb-4 border-b border-gray-200 bg-white">
            <div className="flex items-center justify-between flex-wrap gap-4">

                {/* LEFT SIDE */}
                <div className="flex items-center gap-3 flex-wrap">

                    <h1 className="font-semibold text-xl text-gray-900">
                        {clientName}
                    </h1>

                    <IoMdStarOutline className="bg-white cursor-pointer border border-gray-200 rounded-md text-lg text-gray-500 p-0.5" />

                    {/* Not Assigned with same border + bg */}
                    <button
                        type="button"
                        className="flex items-center gap-2 text-sm text-gray-700 bg-white border border-gray-200 rounded-md px-3 py-1.5 hover:bg-gray-50"
                    >
                        Not assigned
                        <FaChevronDown className="text-xs text-gray-500" />
                    </button>

                    <span className='text-gray-400'>/</span>

                    <h2 className="font-semibold text-base text-gray-700">
                        {activeLabel}
                    </h2>

                </div>

                {/* RIGHT SIDE */}
                <div className="hidden md:flex items-center gap-3 text-sm">
                    <div className="relative">
                        <IoIosInformationCircle
                            onMouseEnter={HandleMouseEnter}
                            onMouseLeave={HandleMouseLeave}
                            className="text-2xl text-[#00C7C7] cursor-pointer"
                        />

                        {hoverInfo && (
                            <div className="absolute right-5 bg-white text-gray-700 text-xs px-3 py-2 rounded-md shadow-lg border border-gray-200 whitespace-nowrap">
                                Learn more about Atlas
                            </div>
                        )}
                    </div>
                </div>

            </div>
        </div>
    )
}

export default TopBar
