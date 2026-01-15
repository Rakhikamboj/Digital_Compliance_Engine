const SelectDropdown = ({ value, onChange, options=[], }) => {
  const selectStyle = {
    width: "100%",
    height: "32px",
    padding: "4px 6px",
    border: "1px solid 194d2a",
    borderRadius: "4px",
    fontSize: "14px",
    backgroundColor: "#ffffff",
    outline: "none",
    cursor: "pointer",
  }

  return (
    <select
      style={selectStyle}
      value={value}
      onChange={onChange}
    >
        {Array.isArray(options) &&        
      options.map((option) => (
        <option key={option.value} value={option.value}>
          {option.label}
        </option>
      ))}
    </select>
  )
}

export default SelectDropdown
