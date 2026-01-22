import React from 'react'
import DashboardHeader from '../components/DashboardHeader'
import SideXTopbar from '../components/SideXTopbar'

const Dashboard = () => {
    return (
        <div className="bg-[rgb(37,38,45)] min-h-screen">
            <DashboardHeader />
            <SideXTopbar />
        </div>
    )
}

export default Dashboard