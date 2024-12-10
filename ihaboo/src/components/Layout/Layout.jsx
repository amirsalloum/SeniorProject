import React, { useState } from "react";
import TopNavbar from "../TopNavBar/TopNavBar";
import FirstMenu from "../FirstMenu/FirstMenu";
import SecondMenu from "../SecondMenu/SecondMenu";
import LeaveModal from "../../components/LeaveModal/LeaveModal"; // Import LeaveModal

const Layout = (props) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isLeaveModalOpen, setIsLeaveModalOpen] = useState(false); // Manage modal state here

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <div className="flex h-screen relative">
      {/* First Menu - Hidden on extra small screens */}
      <div className="hidden xs:flex w-25 bg-[#212F3D] flex-col justify-between">
        <FirstMenu />
      </div>
      {/* Right-side container with TopNavbar and content */}
      <div className="flex flex-col flex-1 h-full">
        <TopNavbar toggleMenu={toggleMenu} />

        <div className="flex flex-1 bg-[#f5f5f5] relative">
          <SecondMenu
            isMenuOpen={isMenuOpen}
            closeMenu={() => setIsMenuOpen(false)}
            setIsLeaveModalOpen={setIsLeaveModalOpen}
          />

          <div className="flex-grow bg-[#DEE0E4] overflow-y-auto scrollbar-hidden">
            {props.children}
          </div>
        </div>
      </div>
      {/* Leave Modal */}
      {isLeaveModalOpen && (
        <LeaveModal onClose={() => setIsLeaveModalOpen(false)} />
      )}{" "}
      {/* Render LeaveModal */}
    </div>
  );
};

export default Layout;