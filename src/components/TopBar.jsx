import React from 'react'
import { IoMdStarOutline } from "react-icons/io"
import { FaChevronDown } from 'react-icons/fa'

const TopBar = () => {
    return (
        <div className="w-full px-4 py-3">

            <div className="flex items-center justify-between flex-wrap gap-4">

                {/* LEFT SIDE */}
                <div className="flex items-center gap-3 flex-wrap">

                    <h1 className="font-bold text-xl">
                        Mia Labs
                    </h1>

                    <IoMdStarOutline className='bg-[rgb(245,245,245)] cursor-pointer border border-gray-200 rounded-sm text-lg' />

                    {/* Not Assigned with same border + bg */}
                    <button
                        type="button"
                        className="flex items-center gap-1 text-sm bg-[rgb(245,245,245)] border border-gray-200 rounded-sm px-2 py-1"
                    >
                        Not Assigned
                        <FaChevronDown className="text-xs" />
                    </button>

                    <span>/</span>

                    <h2 className="font-medium">
                        Assesment
                    </h2>

                    {/* Only Pro + X green */}
                    <span className="px-2  rounded-md text-xs font-semibold">
                        <span className="bg-[rgb(61,144,114)] text-white px-1 rounded">
                            Pro + X
                        </span>{' '}
                        <span className="font-normal text-black">
                            features are unlocked for this client.
                        </span>
                    </span>

                </div>

                {/* RIGHT SIDE */}
                <div className="flex items-center gap-3 text-sm">

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
