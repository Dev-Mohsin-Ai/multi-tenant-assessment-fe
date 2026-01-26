import React, { useState } from 'react'
import Select from 'react-select'

const SearchTemplate = ({ value, onChange, options, isLoading, placeholder = 'Select an option...' }) => {
  const [selected, setSelected] = useState(null)

  const handleChange = (option) => {
    setSelected(option)
    if (onChange) {
      onChange(option)
    }
  }

  const resolvedOptions = Array.isArray(options) ? options : []

  return (
    <div>
      <Select
        options={resolvedOptions}
        value={value || selected}
        onChange={onChange || handleChange}
        placeholder={placeholder}
        isLoading={isLoading}
      />
    </div>
  )
}

export default SearchTemplate
