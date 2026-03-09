import React, { useMemo } from 'react'
import Select from 'react-select'

const toOption = (option) => {
  if (option && typeof option === 'object' && Object.prototype.hasOwnProperty.call(option, 'value')) {
    return option
  }
  return { value: option, label: String(option ?? '') }
}

const getHeight = (size) => (size === 'sm' ? 36 : 40)
const getFontSize = (size) => (size === 'sm' ? 12 : 14)

const AppSelect = ({
  options = [],
  value,
  onChange,
  placeholder = 'Select...',
  className = '',
  isDisabled = false,
  isSearchable = false,
  isClearable = false,
  menuPlacement = 'auto',
  size = 'md',
}) => {
  const normalizedOptions = useMemo(() => options.map(toOption), [options])
  const selectedOption = useMemo(
    () => normalizedOptions.find((option) => String(option.value) === String(value)) || null,
    [normalizedOptions, value]
  )
  const controlHeight = getHeight(size)
  const fontSize = getFontSize(size)

  return (
    <Select
      options={normalizedOptions}
      value={selectedOption}
      onChange={(option) => onChange?.(option?.value ?? null)}
      placeholder={placeholder}
      isDisabled={isDisabled}
      isSearchable={isSearchable}
      isClearable={isClearable}
      menuPlacement={menuPlacement}
      className={className}
      menuPortalTarget={typeof document !== 'undefined' ? document.body : null}
      styles={{
        menuPortal: (base) => ({ ...base, zIndex: 9999 }),
        control: (base, state) => ({
          ...base,
          minHeight: controlHeight,
          height: controlHeight,
          fontSize,
          borderColor: state.isFocused ? 'rgb(5,117,204)' : '#d1d5db',
          boxShadow: 'none',
          '&:hover': {
            borderColor: state.isFocused ? 'rgb(5,117,204)' : '#d1d5db',
          },
        }),
        valueContainer: (base) => ({
          ...base,
          height: controlHeight,
          fontSize,
          paddingTop: 0,
          paddingBottom: 0,
          paddingLeft: 12,
          paddingRight: 12,
        }),
        input: (base) => ({ ...base, margin: 0, padding: 0, fontSize }),
        singleValue: (base) => ({ ...base, fontSize }),
        placeholder: (base) => ({ ...base, fontSize }),
        indicatorsContainer: (base) => ({ ...base, height: controlHeight }),
        indicatorSeparator: () => ({ display: 'none' }),
        option: (base, state) => ({
          ...base,
          fontSize,
          backgroundColor: state.isFocused ? 'rgb(236,245,255)' : '#ffffff',
          color: '#1f2937',
        }),
      }}
    />
  )
}

export default AppSelect
