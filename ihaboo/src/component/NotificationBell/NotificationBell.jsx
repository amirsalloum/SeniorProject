import React, { useState, useEffect, useRef } from "react";
import axios from "axios";
import { FaBell, FaTimes } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import { getUserRole } from "../../utils/getUserRole";

const socket = io("http://localhost:3001");

const formatDate = (dateString) => {
  const date = new Date(dateString);
  return isNaN(date.getTime())
    ? "Invalid Date"
    : date.toLocaleString("en-US", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
};

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const navigate = useNavigate();
  const userRole = getUserRole();
  const notificationRef = useRef(null);  // Ref to detect click outside

  // Fetch notifications from the server
  const fetchNotifications = async () => {
    const token = localStorage.getItem("authToken");

    const apiUrl =
      userRole === "Employee"
        ? "http://localhost:3001/api/notifications/employee-notifications"
        : "http://localhost:3001/api/notifications/user-notifications";

    if (apiUrl) {
      const response = await axios.get(apiUrl, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data && response.data.Status === "Success") {
        const formattedNotifications = response.data.Data.map(
          (notification) => ({
            ...notification,
            formattedDate: formatDate(notification.createdAt),
          })
        );
        setNotifications(formattedNotifications);
        setUnreadCount(
          formattedNotifications.filter((n) => n.isRead === 0).length
        );
      }
    }
  };

  // Socket event listeners for notifications
  useEffect(() => {
    fetchNotifications();

    socket.on("notification-received", () => {
      fetchNotifications();
    });

    socket.on("notification-updated", ({ notificationID }) => {
      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationID === notificationID ? { ...n, isRead: 1 } : n
        )
      );
      setUnreadCount((prev) => prev - 1);
    });

    socket.on("notification-deleted", ({ notificationID }) => {
      setNotifications((prev) => {
        const updatedNotifications = prev.filter(
          (n) => n.notificationID !== notificationID
        );
        const wasUnread = prev.some(
          (n) => n.notificationID === notificationID && n.isRead === 0
        );
        if (wasUnread) {
          setUnreadCount((prevUnread) => prevUnread - 1);
        }
        return updatedNotifications;
      });
    });

    return () => {
      socket.off("notification-received");
      socket.off("notification-updated");
      socket.off("notification-deleted");
    };
  }, [userRole]);

  // Handle click on the bell icon
  const handleBellClick = () => setShowNotifications(!showNotifications);

  // Handle click on a notification
  const handleNotificationClick = async (notification) => {
    const token = localStorage.getItem("authToken");
    try {
      await axios.put(
        "http://localhost:3001/api/notifications/mark-as-read",
        { notificationID: notification.notificationID },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setNotifications((prev) =>
        prev.map((n) =>
          n.notificationID === notification.notificationID
            ? { ...n, isRead: 1 }
            : n
        )
      );
      setUnreadCount((prev) => prev - 1);
      setShowNotifications(false);

      if (notification.leaveRequestID) {
        const roleToPageMap = {
          Admin: `/adminLeaveHistory?leaveRequestID=${notification.leaveRequestID}`,
          Supervisor: `/supervisorLeaveHistory?leaveRequestID=${notification.leaveRequestID}`,
          HR: `/HRLeaveHistory?leaveRequestID=${notification.leaveRequestID}`,
          Employee: `/leaveHistory?leaveRequestID=${notification.leaveRequestID}`,
        };
        navigate(roleToPageMap[userRole] || "/leaveHistory");
      }
    } catch (error) {
      console.error("Error marking notification as read:", error);
    }
  };

  // Handle delete a single notification
  const handleDeleteNotification = async (notificationID) => {
    const token = localStorage.getItem("authToken");

    try {
      const response = await axios.delete(
        "http://localhost:3001/api/notifications/delete",
        {
          headers: { Authorization: `Bearer ${token}` },
          data: { notificationID },
        }
      );

      if (response.data && response.data.Status === "Success") {
        setNotifications((prev) =>
          prev.filter((n) => n.notificationID !== notificationID)
        );
        const wasUnread = notifications.some(
          (n) => n.notificationID === notificationID && n.isRead === 0
        );
        if (wasUnread) {
          setUnreadCount((prev) => prev - 1);
        }
      } else {
        console.error("Failed to delete notification:", response.data);
      }
    } catch (error) {
      console.error("Error deleting notification:", error);
    }
  };

  // Handle delete all notifications
  const handleDeleteAllNotifications = async () => {
    const token = localStorage.getItem("authToken");

    try {
      const response = await axios.delete(
        "http://localhost:3001/api/notifications/delete-all",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.status === 200) {
        setNotifications([]);
        setUnreadCount(0);
      }
    } catch (error) {
      console.error("Error deleting all notifications:", error);
    }
  };

  // Close the notification if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationRef.current && !notificationRef.current.contains(event.target)) {
        setShowNotifications(false); // Close the notification
      }
    };

    // Attach event listener for clicks outside
    document.addEventListener("mousedown", handleClickOutside);

    // Clean up the event listener on component unmount
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative">
      <div className="relative cursor-pointer" onClick={handleBellClick}>
        <FaBell className="text-2xl" />
        {unreadCount > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full px-2 py-1 text-xs">
            {unreadCount}
          </span>
        )}
      </div>
  
      {showNotifications && (
        <div
          ref={notificationRef} // Ref to detect click outside
          className="absolute top-10 right-0 w-[350px] bg-white border border-gray-300 shadow-lg z-50 rounded-lg max-h-[400px]"
        >
          {/* Sticky header */}
          <div className="flex justify-between items-center px-4 py-4 bg-white border-b sticky top-0 z-10">
            <h3 className="text-xl font-semibold">Notifications</h3>
            <button
              className="text-red-500 text-sm hover:underline mt-2"
              onClick={handleDeleteAllNotifications}
            >
              Clear all
            </button>
          </div>
  
          {/* Scrollable notifications */}
          <div className="bg-blue-50 max-h-[300px] overflow-y-auto">
            <ul className="list-none m-0 p-0">
              {notifications.length > 0 ? (
                (showAll ? notifications : notifications.slice(0, 5)).map(
                  (notification, index) => (
                    <li
                      key={index}
                      className={`p-4 cursor-pointer relative transition-colors duration-300 border-b border-gray-300 group ${
                        notification.isRead
                          ? "bg-gray-100 font-normal"
                          : "bg-blue-100 font-bold "
                      }`}
                      onClick={() => handleNotificationClick(notification)}
                    >
                      <div className="flex items-center justify-between relative">
                        <div className="text-base flex-grow mr-2 break-words tracking-tight">
                          {notification.message}
                        </div>
                        {!notification.isRead && (
                          <span className="absolute bottom-2 right-2 bg-red-500 w-2.5 h-2.5 rounded-full"></span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-2">
                        {notification.formattedDate}
                      </div>
                      <div
                        className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition-opacity duration-300 cursor-pointer"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteNotification(notification.notificationID);
                        }}
                      >
                        <FaTimes className="text-black text-sm hover:text-red-500 transition-colors duration-300" />
                      </div>
                    </li>
                  )
                )
              ) : (
                <li className="p-5 text-center text-gray-600">
                  No notifications yet
                </li>
              )}
            </ul>
  
            {/* View more / View less button */}
            {!showAll && notifications.length > 5 && (
              <div
                className="text-center p-3 text-blue-600 cursor-pointer hover:underline"
                onClick={() => setShowAll(true)}
              >
                View more...
              </div>
            )}
            {showAll && (
              <div
                className="text-center p-3 text-blue-600 cursor-pointer hover:underline"
                onClick={() => setShowAll(false)}
              >
                View less...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
  
};

export default NotificationBell;
