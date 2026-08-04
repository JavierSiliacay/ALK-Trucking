import React, { useState, useEffect } from "react";

interface CurrencyInputProps {
  value: number | "";
  onChange: (val: number | "") => void;
  className?: string;
  placeholder?: string;
  required?: boolean;
}

export function CurrencyInput({
  value,
  onChange,
  className,
  placeholder,
  required,
}: CurrencyInputProps) {
  const [displayValue, setDisplayValue] = useState("");

  // Sync state from above (only if it doesn't match our current number logic to prevent jumping cursors)
  useEffect(() => {
    if (value === "") {
      setDisplayValue("");
    } else {
      const parsedDisplay = parseFloat(displayValue.replace(/,/g, ""));
      if (parsedDisplay !== value) {
        setDisplayValue(value.toLocaleString("en-US", { maximumFractionDigits: 2 }));
      }
    }
  }, [value]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value;
    
    // Remove anything that isn't a digit or a dot
    val = val.replace(/[^0-9.]/g, "");
    
    // Prevent multiple dots
    const parts = val.split(".");
    if (parts.length > 2) {
      val = parts[0] + "." + parts.slice(1).join("");
    }

    if (val === "") {
      setDisplayValue("");
      onChange("");
      return;
    }

    // Add commas to the integer part
    const formattedParts = val.split(".");
    formattedParts[0] = formattedParts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    const formatted = formattedParts.join(".");
    
    setDisplayValue(formatted);
    
    // Send actual number to parent
    if (val === ".") {
      onChange("");
    } else {
      onChange(Number(val));
    }
  };

  const handleBlur = () => {
    // Reformat on blur to clean up things like trailing dots
    if (value !== "") {
       setDisplayValue(Number(value).toLocaleString("en-US", { maximumFractionDigits: 2 }));
    }
  };

  return (
    <input
      type="text"
      inputMode="decimal"
      required={required}
      value={displayValue}
      onChange={handleChange}
      onBlur={handleBlur}
      placeholder={placeholder}
      className={className}
    />
  );
}
