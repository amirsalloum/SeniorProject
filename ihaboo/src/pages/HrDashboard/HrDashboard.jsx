import React, { useEffect, useState } from "react";
import axios from "axios";
import { FaBell } from "react-icons/fa"; // Import the bell icon
import "./HrDashboard.scss";

const HrDashboard = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0); // State to track unread notifications
  const [showNotifications, setShowNotifications] = useState(false); // Toggle to show/hide notifications

  useEffect(() => {
    const token = localStorage.getItem("authToken");

    // Fetch notifications via HTTP
    const fetchNotifications = async () => {
      try {
        const response = await axios.get("http://localhost:3001/api/notifications/user-notifications", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (response.data && response.data.Status === "Success") {
          setNotifications(response.data.Data);

          // Count the number of unread notifications
          const unread = response.data.Data.filter((notification) => notification.isRead === 0);
          setUnreadCount(unread.length); // Update the unread count
        }
      } catch (error) {
        console.error("Error fetching notifications:", error);
      }
    };

    fetchNotifications();
  }, []);

  // Handle when the bell icon is clicked (toggle notifications display)
  const handleBellClick = () => {
    setShowNotifications((prev) => !prev);
  };

  return (
    <div className="dashboard-container">
      <div className="notifications-bell">
        {/* Bell icon with unread count */}
        <div className="bell-container" onClick={handleBellClick}>
          <FaBell className="bell-icon" />
          {unreadCount > 0 && <span className="unread-count">{unreadCount}</span>}
        </div>

        {/* Show notifications when bell is clicked */}
        {showNotifications && (
          <div className="notifications-panel">
            <h3>Notifications</h3>
            <ul>
              {notifications.length > 0 ? (
                notifications.map((notification, index) => (
                  <li key={index} className={!notification.isRead ? "unread" : ""}>
                    {notification.message}
                  </li>
                ))
              ) : (
                <li>No notifications yet</li>
              )}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default HrDashboard;
