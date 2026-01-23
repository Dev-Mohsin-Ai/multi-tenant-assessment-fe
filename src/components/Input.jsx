import React from 'react'

const Input = ({ label, type = "text", text, onChange, value, required, error, placeholder }) => {

    return (
        <div className="flex flex-col px-2">

            <label className="text-sm font-semibold text-[#222229] mb-1">
                {label}{" "}
                {text && <span className="font-normal text-gray-400">{text}</span>}
            </label>

            <input
                type={type}
                onChange={onChange}
                placeholder={placeholder}
                value={value}
                required={required}
                className="h-10 px-3 border-[#EFEAE8] border-2 rounded-xl outline-none
            focus:border-[#473c9a] focus:border-4 hover:border-[#473c9a]
            text-sm focus:bg-[#f1f1f1] text-[#473c9a]"

            />
            {
                error && (
                    <p className="text-sm font-normal text-[#d32f2f] mt-1">
                        {error}
                    </p>
                )
            }

        </div>
    )
}

export default Input
