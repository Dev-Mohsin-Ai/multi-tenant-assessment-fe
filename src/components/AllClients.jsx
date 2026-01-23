import React from 'react'
import Button from './Button'
import { IoChevronDown } from "react-icons/io5";
import Table from './tables';

const AllClients = () => {

  const columns = [
    { key: "name", label: "Client" },
    { key: "segment", label: "Segment" },
    { key: "team", label: "Account Team" },
    { key: "dmi", label: "DMI" },
    { key: "report", label: "Report" },
  ];

  const data = [
    {
      name: "Mia Labs",
      segment: "Enterprise",
      team: "Ali Khan",
      dmi: "Enabled",
      report: "View",
    },
    {
      name: "Tech Corp",
      segment: "SMB",
      team: "Sara Ahmed",
      dmi: "Disabled",
      report: "View",
    },
    {
      name: "Nova Systems",
      segment: "Mid Market",
      team: "Usman Raza",
      dmi: "Enabled",
      report: "View",
    },
  ];

  return (
    <div>
      <div className="px-4 pt-2 bg-[rgb(248,248,250)] min-h-screen rounded-tl-2xl overflow-hidden">

        <h2 className="text-2xl font-bold mb-4">All Clients</h2>

        <div className='flex gap-3'>
          <Button
            text={"Segments"}
            icon={<IoChevronDown className='font-bold' />}
          />

          <Button
            text={"Account Team"}
            icon={<IoChevronDown className='font-bold' />}
          />
        </div>

        <div>
          <h1 className="text-lg font-bold mt-6">
            1-50 of 255 results
          </h1>
        </div>

        <div className="mt-4 flex items-center gap-3">
          <input
            type="text"
            placeholder="Search results..."
            className="flex-1 h-10 px-3 border border-[rgb(200,200,205)] rounded-sm outline-none text-sm text-[#473c9a] bg-white placeholder:text-[rgb(182,183,195)] focus:border-2 focus:border-[#473c9a]"
          />

          <Button
            className="h-10"
            text={"Choose columns.."}
            icon={<IoChevronDown className='font-bold' />}
          />
        </div>

        <Table columns={columns} data={data} />

      </div>
    </div>
  )
}

export default AllClients;
