import React from 'react'
import DashboardHeader from '../components/DashboardHeader'
import SideTopbar from '../components/SideTopbar'


const Dashboard = () => {
    return (
        <div className="bg-[rgb(37,38,45)] min-h-screen">
            <DashboardHeader />
            <SideTopbar />
        </div>
    )
}

export default Dashboard
