import React, { useState } from 'react';

function Tabs({ tabs, children }) {
  const [activeTab, setActiveTab] = useState(tabs[0]);
  const [fade, setFade] = useState(false);

  const handleTabChange = (tab) => {
    setFade(true); // Start fade-out
    setTimeout(() => {
      setActiveTab(tab); // Change the tab
      setFade(false); // Start fade-in
    }, 150); // Adjust this duration to match the transition duration
  };

  return (
    <div className="w-full max-w-max">
      {/* Tab List */}
      <div className="bg-gray-200 rounded-2xl p-1.5 ">
        <div className="inline-flex items-center justify-center mx-auto ">
          {tabs.map((tab) => (
            <button
              key={tab}
              className={`py-1.5 px-6 text-sm font-medium rounded-xl focus:outline-none ${
                activeTab === tab
                  ? 'bg-white text-black shadow-md'
                  : 'text-gray-600 hover:text-black'
              }`}
              onClick={() => handleTabChange(tab)}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Panels with Transition */}
      <div
        className={`mt-4 transition-opacity duration-300 ${
          fade ? 'opacity-0' : 'opacity-100'
        }`}
      >
        {React.Children.map(children, (child, index) => {
          if (tabs[index] === activeTab) {
            return <div>{child}</div>;
          }
          return null;
        })}
      </div>
    </div>
  );
}

export default Tabs;
