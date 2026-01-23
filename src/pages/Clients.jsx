import React from 'react'
import DashboardHeader from '../components/DashboardHeader'
import AllClients from '../components/AllClients'

const Clients = () => {
    return (
        <div className="bg-[rgb(37,38,45)] min-h-screen">
            <DashboardHeader />
            <div className="pt-22">
            <div className="bg-[rgb(248,248,250)] min-h-[calc(100vh-6rem)] rounded-tl-xl overflow-hidden">
                <AllClients />
            </div>
        </div>
        </div>
    )
}

export default Clients

