import React from "react";
import { NavLink } from "react-router-dom";
import { getUserRole } from "../../utils/getUserRole";
import {
  FaPlus,
  FaRegSun ,
  FaHome,
  FaHistory,
  FaUserCheck,
  FaUsers,
  FaUser,
  FaMoneyCheck 
} from "react-icons/fa";


const SecondMenu = ({ isMenuOpen, closeMenu, setIsLeaveModalOpen }) => {
  const role = getUserRole();

  // Menu items with icons corresponding to their labels
  const menuItems = {
    Employee: [
      {
        label: "Dashboard",
        path: "/",
        icon: FaHome,
      },
      {
        label: "Leave History",
        path: "/leaveHistory",
        icon: FaHistory,
      },
      {
        label: "Attendance",
        path: "/attendance",
        icon: FaUserCheck,
      },
      {
        label: "Payroll",
        path: "/payRoll",
        icon: FaMoneyCheck,
      },
    ],
    HR: [
      {
        label: "Dashboard",
        path: "/hr-dashboard",
        icon: FaHome,
      },
      {
        label: "Leave History",
        path: "/HRLeaveHistory",
        icon: FaHistory,
      },
      {
        label: "Attendance",
        path: "/hr-attendance",
        icon: FaUserCheck,
      },
      {
        label: "Payroll",
        path: "/payroll",
        icon: FaMoneyCheck,
      },
      {
        label: "Employees",
        path: "/Hremployees",
        icon: FaUsers,
      },
      {
        label: "Profile",
        path: "/",
        icon: FaUser,
      },
    ],
    Admin: [
      {
        label: "Dashboard",
        path: "/admin-dashboard",
        icon: FaHome,
      },
      {
        label: "Leave History",
        path: "/adminLeaveHistory",
        icon: FaHistory,
      },
      {
        label: "Attendance",
        path: "/admin-attendance",
        icon: FaUserCheck,
      },
      {
        label: "Payroll",
        path: "/payroll",
        icon: FaMoneyCheck,
      },
      {
        label: "Employees",
        path: "/employees",
        icon: FaUsers,
      },
      {
        label: "Profile",
        path: "/",
        icon: FaUser,
      },
      {
        label: "Settings",
        path: "/admin-setting",
        icon: FaRegSun ,
      },
    ],
    Supervisor: [
      {
        label: "Dashboard",
        path: "/supervisor-dashboard",
        icon: FaHome,
      },
      {
        label: "Leave History",
        path: "/supervisorLeaveHistory",
        icon: FaHistory,
      },
      {
        label: "Attendance",
        path: "/supervisorattendance",
        icon: FaUserCheck,
      },
      {
        label: "Payroll",
        path: "/payroll",
        icon: FaMoneyCheck,
      },
      {
        label: "Employees",
        path: "/Supemployees",
        icon: FaUsers,
      },
      {
        label: "Profile",
        path: "/",
        icon: FaUser,
      },
    ],
  };

  const currentMenuItems = menuItems[role] || menuItems.Employee;

  return (
    <>
      {isMenuOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={closeMenu}
        ></div>
      )}

      <div
        className={`fixed inset-y-0 left-0 bg-gray-200 px-4 py-5 p-8 w-56 transform transition-transform duration-300 ease-in-out z-50 ${
          isMenuOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static lg:flex lg:flex-col lg:w-56 lg:shadow-none`}
      >
        <button
          className="lg:hidden mb-4 text-gray-800 text-xl font-semibold self-end"
          onClick={closeMenu}
          aria-label="Close Menu"
        >
          ✕
        </button>

        <button
          className="mb-3 bg-gray-800 text-white font-semibold text-sm rounded-md px-3 py-2 flex items-center justify-center w-full cursor-pointer transition duration-300 hover:bg-blue-950"
          onClick={() => {
            setIsLeaveModalOpen(true);
            closeMenu();
          }}
        >
          <span className="text-yellow-500 mr-1 text-base font-bold">
            <FaPlus className="mr-1" />
          </span>
          Request Leave
        </button>

        <nav className="flex-1">
          {currentMenuItems.map((item, index) => (
            <NavLink
              key={index}
              to={item.path}
              onClick={closeMenu}
              className={({ isActive }) =>
                `group flex items-center px-3 py-2 my-1 text-sm font-semibold rounded-md transition-colors duration-200 ${
                  isActive
                    ? "bg-gray-700 text-white"
                    : "bg-gray-200 text-gray-600 hover:bg-gray-400 hover:text-white"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span className="menu-icon mr-3 w-5 h-5">
                    <item.icon
                      className={`w-5 h-5 transition duration-300 ${
                        isActive
                          ? "text-white"
                          : "text-gray-600 group-hover:text-white"
                      }`}
                    />
                  </span>
                  <span
                    className={`menu-label ${
                      isActive
                        ? "text-white"
                        : "text-gray-600 group-hover:text-white"
                    }`}
                  >
                    {item.label}
                  </span>
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>
    </>
  );
};

export default SecondMenu;
