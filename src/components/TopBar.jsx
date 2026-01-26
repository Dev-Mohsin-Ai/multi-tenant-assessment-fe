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
        <div className="w-full px-4 py-3">

            <div className="flex items-center justify-between flex-wrap gap-4">

                {/* LEFT SIDE */}
                <div className="flex items-center gap-3 flex-wrap">

                    <h1 className="font-bold text-xl">
                        {clientName}
                    </h1>

                    <IoMdStarOutline className='bg-[rgb(245,245,245)] cursor-pointer border border-gray-200 rounded-sm text-lg' />

                    {/* Not Assigned with same border + bg */}
                    <button
                        type="button"
                        className="flex pl-6 items-center gap-1 text-sm bg-[rgb(248,248,250)] border border-gray-200 rounded-sm px-2 py-1"
                    >
                        Not assigned
                        <FaChevronDown className="text-xs" />
                    </button>

                    <span className='text-gray-400'>/</span>

                    <h2 className="font-bold text-lg">
                        {activeLabel}
                    </h2>

                    {/* Only Pro + X green */}
                    <span className="px-2 rounded-md text-xs font-semibold">
                        <span className="bg-[rgb(61,144,114)] text-white px-1 rounded-md py-0.5">
                            PRO + X
                        </span>{' '}
                        <span className="font-normal text-[rgba(0,0,0,0.64)]">
                            features are unlocked for this client.
                        </span>
                    </span>

                </div>

                {/* RIGHT SIDE */}
                <div className="flex items-center gap-3 text-sm">
                    <div className="relative">
                        <IoIosInformationCircle
                            onMouseEnter={HandleMouseEnter}
                            onMouseLeave={HandleMouseLeave}
                            className="text-2xl text-[rgb(5,117,204)] cursor-pointer"
                        />

                        {hoverInfo && (
                            <div className="absolute right-5  bg-gray-50 text-black text-xs px-2 py-1 rounded shadow-lg whitespace-nowrap">
                                Learn more about Lifecycle Manager X
                            </div>
                        )}
                    </div>

                    <span className="font-medium">
                        Pro + X Features:
                    </span>

                    <div className="flex items-center gap-2">
                        <span className='font-bold'>On</span>

                        <button className="w-10 h-5 bg-gray-400 rounded-full relative">
                            <span className="absolute left-1 top-1 w-3 h-3 bg-white rounded-full"></span>
                        </button>
                    </div>

                </div>

            </div>
        </div>
    )
}

export default TopBar
