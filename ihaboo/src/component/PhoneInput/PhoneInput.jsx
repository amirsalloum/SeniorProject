import React, { useState } from "react";
import PhoneInput from "react-phone-input-2";
import "react-phone-input-2/lib/style.css";

const PhoneInputOnly = ({
  onPhoneNumberChange,
  initialPhone = "",
  defaultCountry = "LB",
}) => {
  const [phoneNumber, setPhoneNumber] = useState(initialPhone);

  const handlePhoneNumberChange = (value) => {
    setPhoneNumber(value);
    if (onPhoneNumberChange) {
      onPhoneNumberChange(value); // Trigger the callback
    }
  };

  return (
    <div className="mt-1 w-full">
      <PhoneInput
        country={defaultCountry}
        value={phoneNumber}
        onChange={handlePhoneNumberChange}
        inputProps={{
          name: "phoneNumber",
          required: true,
          autoFocus: false,
        }}
        containerClass="w-full"
        inputClass="w-full p-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
        buttonClass="bg-gray-100 border border-gray-300 rounded-l-lg focus:ring-2 focus:ring-blue-500"
        dropdownClass="rounded-lg shadow-lg border-gray-300"
      />
    </div>
  );
};

export default PhoneInputOnly;
