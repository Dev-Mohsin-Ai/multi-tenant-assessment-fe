import React, { useState } from 'react'
import List from '../assets/icons/List.svg'
const Sidebar = () => {
    const [isSelect, setIsSelect] = useState(false);

    return (
        <div
            onClick={() => setIsSelect(true)}
            className={`flex items-center gap-3 px-4 cursor-pointer py-2 max-w-45 pr-2 ${isSelect ? 'bg-gray-200 border-l-2 border-black rounded-r-lg' : ''}`}
        >
            <img src={List} alt="" />
            <h1>Assesments</h1>
        </div>
    );
};

export default Sidebar