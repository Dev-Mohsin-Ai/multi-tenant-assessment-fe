import React, { useState } from 'react'
import Select from 'react-select'

const SearchTemplate = ({ value, onChange }) => {
  const options = [
    { value: "ai rediness assessment", label: "AI Rediness Assessment" },
    { value: "data strategy", label: "Data Strategy" },
    { value: "ml roadmap", label: "ML Roadmap" },
    { value: "ai governance", label: "AI Governance" },
    { value: "model evaluation", label: "Model Evaluation" },
    { value: "automation audit", label: "Automation Audit" },
    { value: "digital transformation", label: "Digital Transformation" },
    { value: "process optimization", label: "Process Optimization" },
    { value: "ai implementation", label: "AI Implementation" },
    { value: "cloud migration", label: "Cloud Migration" }
  ];

  const [selected, setSelected] = useState(null);

  const handleChange = (option) => {
    setSelected(option);
    if (onChange) {
      onChange(option);
    }
  };

  return (
    <div>
      <Select
        options={options}
        value={value || selected}
        onChange={onChange || handleChange}
        placeholder="Select an option..."
      />
    </div>
  );
};

export default SearchTemplate;
