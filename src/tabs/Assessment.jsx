import React from 'react'
import { FaPlus, FaGear } from "react-icons/fa6";
import Tables from '../components/tables';
import { RiDeleteBin6Line } from "react-icons/ri";
const Assessment = () => {
  const columns = [
    { key: "title", label: "Title" },
    { key: "performedBy", label: "Performed By" },
    { key: "date", label: "Date" },
    { key: "score", label: "Score" },
    { key: "items", label: "Items" },
    { key: "answers", label: "Answers" },
    { key: "completion", label: "Completion" },
    { key: "delete", label: "Delete" },
  ];


  const data = [
    {
      title: "Cyber Insurance Readiness Assessment",
      performedBy: "Jack Segar",
      date: "2026/01/08",
      score: "40.00",
      items: 20,
      answers: 10,
      completion: "50%",
      delete: <RiDeleteBin6Line className="text-red-500" />,
    },
    {
      title: "AI Readiness Assessment",
      performedBy: "Jack Segar",
      date: "2025/11/24",
      score: "-",
      items: 28,
      answers: 0,
      completion: "0%",
      delete: <RiDeleteBin6Line className="text-red-500" />,
    },
    {
      title: "Roadmap Assessment Template",
      performedBy: "Jack Segar",
      date: "2025/11/20",
      score: "66.67",
      items: 48,
      answers: 2,
      completion: "4%",
      delete: <RiDeleteBin6Line className="text-red-500" />,
    },
    {
      title: "AI Readiness Assessment",
      performedBy: "Jack Segar",
      date: "2025/11/19",
      score: "-",
      items: 28,
      answers: 0,
      completion: "0%",
      delete: <RiDeleteBin6Line className="text-red-500" />,
    },
    {
      title: "Roadmap Assessment Template",
      performedBy: "Amelia Kao",
      date: "2025/10/22",
      score: "46.15",
      items: 48,
      answers: 3,
      completion: "6%",
      delete: <RiDeleteBin6Line className="text-red-500" />,
    },
    {
      title: "Roadmap Assessment Template",
      performedBy: "Jack Segar",
      date: "2025/09/26",
      score: "62.41",
      items: 49,
      answers: 48,
      completion: "Completed",
      delete: <RiDeleteBin6Line className="text-red-500" />,
    },
  ];

  return (
    <div>
      <div className='flex items-center justify-between'>
        <input
          type="search"
          placeholder='Find in list...'
          className="
            border border-[rgba(0,0,0,0.24)] border-b-[rgb(23,24,31)] h-9 px-3 outline-none focus:border-[#473c9a] hover:border-[#473c9a] focus:border-3 text-sm text-[#473c9a] placeholder-gray-300 focus:placeholder-[#473c9a] bg-white w-1/2 rounded-t-sm focus:bg-[#e9e9ee]
          "
        />
        <div className="flex">
          <button 
          onClick = {<AssesmentDialogue/>}
          className="
          ml-2 h-9
          bg-[rgb(5,117,204)] text-white
          px-4 rounded-md
          flex items-center gap-2
          text-sm font-medium
          hover:bg-[rgb(0,97,170)]
          cursor-pointer
        ">
            <FaPlus  /> New Assessment
          </button>

          <button className="
          ml-2 h-9
          bg-[rgb(248,248,250)] text-black
          px-4 rounded-md
          flex items-center gap-2
          text-sm border border-gray-300
          hover:bg-[rgb(255,255,255)]
        ">
            <FaGear /> Manage Templates
          </button>
        </div>

      </div>

      <div>
        <Tables
          columns={columns}
          data={data}
        />
      </div>
    </div>
  )
}

export default Assessment
