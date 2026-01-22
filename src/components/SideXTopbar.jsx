import React from 'react'
import TopBar from './TopBar'
import Sidebar from './Sidebar'

const SideXTopbar = () => {
    return (
        <div className='fixed left-0 right-0 top-21 bottom-0 bg-[#F8F8FC] rounded-tl-2xl overflow-auto'>
            <TopBar />
            <Sidebar />
        </div>
    )
}

export default SideXTopbar
