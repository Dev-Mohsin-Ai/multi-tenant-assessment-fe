import React from 'react'
import AllClients from '../components/AllClients'
import WorkspaceLayout from '../components/WorkspaceLayout'

const Clients = () => {
    return (
        <WorkspaceLayout activeLabel="Clients" clientName="All Clients" activeNavId="clients">
            <div className="bg-[rgb(248,248,250)] min-h-[calc(100vh-6rem)] rounded-tl-xl overflow-hidden">
                <AllClients />
            </div>
        </WorkspaceLayout>
    )
}

export default Clients
