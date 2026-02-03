import React from 'react'

const Input = ({ label, type = "text", text, onChange, value, required, error, placeholder }) => {

    return (
        <div className="flex flex-col px-2">

            <label className="text-sm font-semibold text-gray-800 mb-1">
                {label}{" "}
                {text && <span className="font-normal text-gray-400">{text}</span>}
            </label>

            <input
                type={type}
                onChange={onChange}
                placeholder={placeholder}
                value={value}
                required={required}
                className="h-10 px-3 border border-gray-200 rounded-md outline-none
            focus:border-[rgb(5,117,204)] focus:ring-1 focus:ring-blue-100
            hover:border-gray-300 text-sm text-gray-900 placeholder:text-gray-400 bg-white"

            />
            {
                error && (
                    <p className="text-sm font-normal text-red-600 mt-1">
                        {error}
                    </p>
                )
            }

        </div>
    )
}

export default Input
