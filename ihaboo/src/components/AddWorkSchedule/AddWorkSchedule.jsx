import React from "react";

export default function WorkScheduleCard({
  workSchedule,
  handleWorkScheduleChange,
}) {
  const daysOfWeek = [
    { full: "Monday", short: "Mo" },
    { full: "Tuesday", short: "Tu" },
    { full: "Wednesday", short: "We" },
    { full: "Thursday", short: "Th" },
    { full: "Friday", short: "Fr" },
  ];

// Inside WorkScheduleCard component
const handleTimeChange = (dayShort, field, value) => {
  let updatedSchedule = [...workSchedule];
  const scheduleIndex = updatedSchedule.findIndex(schedule => schedule.day === dayShort);

  if (scheduleIndex !== -1) {
    // Update existing schedule
    updatedSchedule[scheduleIndex] = {
      ...updatedSchedule[scheduleIndex],
      [field]: value,
    };
    const updatedEntry = updatedSchedule[scheduleIndex];
    // If both startTime and endTime are empty, remove the schedule
    if (!updatedEntry.startTime && !updatedEntry.endTime) {
      updatedSchedule.splice(scheduleIndex, 1);
    }
  } else {
    // Add new schedule for this day
    updatedSchedule.push({
      day: dayShort,
      [field]: value,
    });
  }

  handleWorkScheduleChange(updatedSchedule);
};

  return (
    <div className="flex flex-col bg-transparent w-full p-0 mb-4">
      <h2 className="text-[#424242] font-semibold mb-4 text-xl xs:text-2xl">
        Work Schedule
      </h2>
      {/* md+ Screen Layout */}
      <div className="hidden md:block">
        {/* Days Row */}
        <div className="flex justify-between px-2 mb-4">
          {daysOfWeek.map((dayObj) => (
            <div
              key={dayObj.short}
              className="flex-1 text-center font-bold bg-blue-100 p-2 mx-1 min-w-[80px] rounded-[15px] text-gray-800"
            >
              <span>{dayObj.full}</span>
            </div>
          ))}
        </div>

        {/* Time Inputs Row */}
        <div className="flex justify-between px-2">
          {daysOfWeek.map((dayObj) => {
            const schedule = workSchedule.find(s => s.day === dayObj.short) || {};
            return (
              <div key={dayObj.short} className="flex-1 mx-1 min-w-[80px]">
                <div className="flex items-center gap-2 bg-pink-100 p-2 rounded-[15px]">
                  <input
                    type="time"
                    value={schedule.startTime || ""}
                    onChange={(e) =>
                      handleTimeChange(dayObj.short, "startTime", e.target.value)
                    }
                    className="w-full p-1 rounded border border-gray-300 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <span>-</span>
                  <input
                    type="time"
                    value={schedule.endTime || ""}
                    onChange={(e) =>
                      handleTimeChange(dayObj.short, "endTime", e.target.value)
                    }
                    className="w-full p-1 rounded border border-gray-300 text-center text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* xs Screen Layout */}
      <div className="md:hidden">
        {daysOfWeek.map((dayObj) => {
          const schedule = workSchedule.find(s => s.day === dayObj.short) || {};
          return (
            <div key={dayObj.short} className="flex flex-col gap-2 mb-4">
              <div className="flex items-center justify-center text-gray-800 font-bold bg-blue-100 p-3 rounded-lg">
                <span className="block">{dayObj.full}</span>
              </div>
              <div className="flex items-center gap-2 bg-pink-100 p-4 rounded-lg">
                <input
                  type="time"
                  value={schedule.startTime || ""}
                  onChange={(e) =>
                    handleTimeChange(dayObj.short, "startTime", e.target.value)
                  }
                  className="w-full p-2 rounded border border-gray-300 text-center text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <span>-</span>
                <input
                  type="time"
                  value={schedule.endTime || ""}
                  onChange={(e) =>
                    handleTimeChange(dayObj.short, "endTime", e.target.value)
                  }
                  className="w-full p-2 rounded border border-gray-300 text-center text-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
