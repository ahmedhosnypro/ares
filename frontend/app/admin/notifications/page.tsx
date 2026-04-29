"use client";

import React, { useEffect, useState, useCallback } from "react";
import {
  Box, Card, Typography, Stack, Chip, CircularProgress,
  IconButton, Divider, Container, Alert, Tooltip
} from "@mui/material";
import DoneAllIcon from "@mui/icons-material/DoneAll";
import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";
import { useSession } from "next-auth/react";
import { getNotifications, markNotificationAsRead, seedNotifications } from "@/app/api/notfications/notfications";

// Type definition based on your Schema
type Notification = {
  id: string;
  userId: string;
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
};

export default function NotificationsPage() {
  const { data: session, status } = useSession();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);
  const [seeding, setSeeding] = useState(false);

  const token = session?.accessToken;

  const fetchData = useCallback(async () => {
    if (!token) return;
    
    try {
      setLoading(true);
      const data = await getNotifications(token);
      // Handles both direct array response or nested object response
      const notificationData = Array.isArray(data) ? data : (data?.notifications || []);
      setNotifications(notificationData);
      setError(null);
    } catch (err) {
      setError("Failed to load notifications. Please try again later.");
      console.error("Fetch Error:", err);
    } finally {
      setLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (status === "authenticated") {
      fetchData();
    }
  }, [status, fetchData]);

  const handleMarkRead = async (id: string) => {
    if (!token || processingId) return;
    
    try {
      setProcessingId(id); // Start loading state for this specific item
      await markNotificationAsRead(id, token);
      
      // Update local state immediately for a snappy feel
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch (err) {
      console.error("Update failed:", err);
    } finally {
      setProcessingId(null);
    }
  };

  const handleSeed = async () => {
    if (!token) return;
    try {
      setSeeding(true);
      await seedNotifications(token);
      await fetchData();
    } catch (err) {
      console.error("Seed failed:", err);
      setError("Failed to create dummy notifications.");
    } finally {
      setSeeding(false);
    }
  };

  // 1. Loading State (Session)
  if (status === "loading") {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress size={40} />
      </Box>
    );
  }

  // 2. Unauthenticated State
  if (status === "unauthenticated") {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Alert severity="info">Please sign in to view your notifications.</Alert>
      </Container>
    );
  }

  const unreadCount = notifications.filter(n => !n.isRead).length;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {/* Header Section */}
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight="800" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <NotificationsActiveIcon color="primary" fontSize="large" /> 
          Notifications
        </Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <Chip 
            label={`${unreadCount} Unread`} 
            color={unreadCount > 0 ? "primary" : "default"} 
            sx={{ fontWeight: 'bold' }}
          />
          <Tooltip title="Create dummy notifications for testing">
            <IconButton onClick={handleSeed} disabled={seeding} color="primary" sx={{ bgcolor: 'action.hover' }}>
              {seeding ? <CircularProgress size={20} /> : <span style={{ fontSize: '18px' }}>🔄</span>}
            </IconButton>
          </Tooltip>
        </Stack>
      </Stack>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}

      {/* Main List */}
      <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
        {loading ? (
          <Box p={10} textAlign="center">
            <CircularProgress size={30} />
            <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>Loading your feed...</Typography>
          </Box>
        ) : notifications.length === 0 ? (
          <Box p={10} textAlign="center">
            <Typography color="text.secondary">You're all caught up! No notifications.</Typography>
          </Box>
        ) : (
          notifications.map((n, index) => (
            <React.Fragment key={n.id}>
              <Stack
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{
                  p: 3,
                  transition: "0.2s",
                  bgcolor: n.isRead ? "transparent" : "action.hover",
                  "&:hover": { bgcolor: "rgba(0, 0, 0, 0.02)" },
                }}
              >
                {/* Content */}
                <Box sx={{ flex: 1 }}>
                  <Typography 
                    variant="subtitle1" 
                    fontWeight={n.isRead ? 500 : 700} 
                    color={n.isRead ? "text.secondary" : "text.primary"}
                  >
                    {n.title}
                  </Typography>
                  <Typography variant="body2" sx={{ my: 0.5, color: 'text.secondary' }}>
                    {n.message}
                  </Typography>
                  <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                    {new Date(n.createdAt).toLocaleString("en-US", {
                      month: "short",
                      day: "numeric",
                      hour: "2-digit",
                      minute: "2-digit"
                    })}
                  </Typography>
                </Box>

                {/* Actions */}
                <Box>
                  {!n.isRead ? (
                    <Tooltip title="Mark as Read">
                      <IconButton 
                        size="small" 
                        color="primary" 
                        onClick={() => handleMarkRead(n.id)}
                        disabled={processingId === n.id}
                      >
                        {processingId === n.id ? (
                          <CircularProgress size={20} color="inherit" />
                        ) : (
                          <DoneAllIcon />
                        )}
                      </IconButton>
                    </Tooltip>
                  ) : (
                    <Typography variant="caption" color="text.disabled" sx={{ fontStyle: 'italic' }}>
                      Read
                    </Typography>
                  )}
                </Box>
              </Stack>
              {index < notifications.length - 1 && <Divider />}
            </React.Fragment>
          ))
        )}
      </Card>
    </Container>
  );
}





// "use client";

// import React, { useState, useEffect } from "react";
// import {
//   Box, Card, Typography, Stack, Chip, CircularProgress,
//   IconButton, Divider, Container, Alert, Tooltip
// } from "@mui/material";
// import DoneAllIcon from "@mui/icons-material/DoneAll";
// import NotificationsActiveIcon from "@mui/icons-material/NotificationsActive";

// // --- MOCK DATA FOR TESTING ---
// const MOCK_NOTIFICATIONS = [
//   {
//     id: "1",
//     title: "Welcome to the Platform!",
//     message: "We are glad to have you here. Explore your dashboard to get started.",
//     isRead: false,
//     createdAt: new Date().toISOString(),
//   },
//   {
//     id: "2",
//     title: "Security Update",
//     message: "Your password was successfully changed. If this wasn't you, please contact support immediately.",
//     isRead: false,
//     createdAt: new Date(Date.now() - 3600000).toISOString(), // 1 hour ago
//   },
//   {
//     id: "3",
//     title: "New Connection Request",
//     message: "John Doe wants to connect with you on the professional network.",
//     isRead: true,
//     createdAt: new Date(Date.now() - 86400000).toISOString(), // 1 day ago
//   },
//   {
//     id: "4",
//     title: "System Maintenance",
//     message: "Scheduled maintenance will occur this Sunday at 2:00 AM EST. Expect minor downtime.",
//     isRead: true,
//     createdAt: new Date(Date.now() - 172800000).toISOString(), // 2 days ago
//   }
// ];

// export default function NotificationsPage() {
//   // Using Mock Data instead of API calls
//   const [notifications, setNotifications] = useState(MOCK_NOTIFICATIONS);
//   const [loading, setLoading] = useState(true);
//   const [processingId, setProcessingId] = useState<string | null>(null);

//   // Simulate initial loading
//   useEffect(() => {
//     const timer = setTimeout(() => setLoading(false), 1000);
//     return () => clearTimeout(timer);
//   }, []);

//   const handleMarkRead = (id: string) => {
//     setProcessingId(id);
    
//     // Simulate API delay
//     setTimeout(() => {
//       setNotifications((prev) =>
//         prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
//       );
//       setProcessingId(null);
//     }, 600);
//   };

//   const unreadCount = notifications.filter(n => !n.isRead).length;

//   return (
//     <Container maxWidth="md" sx={{ py: 4 }}>
//       {/* Header Section */}
//       <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
//         <Typography variant="h4" fontWeight="800" sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
//           <NotificationsActiveIcon color="primary" fontSize="large" /> 
//           Notifications
//         </Typography>
//         <Chip 
//           label={`${unreadCount} Unread`} 
//           color={unreadCount > 0 ? "primary" : "default"} 
//           sx={{ fontWeight: 'bold' }}
//         />
//       </Stack>

//       {/* Main List */}
//       <Card elevation={0} sx={{ borderRadius: 3, border: '1px solid', borderColor: 'divider' }}>
//         {loading ? (
//           <Box p={10} textAlign="center">
//             <CircularProgress size={30} />
//             <Typography variant="body2" sx={{ mt: 2, color: 'text.secondary' }}>Loading your feed...</Typography>
//           </Box>
//         ) : (
//           notifications.map((n, index) => (
//             <React.Fragment key={n.id}>
//               <Stack
//                 direction="row"
//                 spacing={2}
//                 alignItems="center"
//                 sx={{
//                   p: 3,
//                   transition: "0.2s",
//                   // Highlight unread notifications with a very subtle blue tint
//                   bgcolor: n.isRead ? "transparent" : "rgba(25, 118, 210, 0.04)",
//                   "&:hover": { bgcolor: "rgba(0, 0, 0, 0.02)" },
//                 }}
//               >
//                 {/* Content */}
//                 <Box sx={{ flex: 1 }}>
//                   <Typography 
//                     variant="subtitle1" 
//                     fontWeight={n.isRead ? 500 : 700} 
//                     color={n.isRead ? "text.secondary" : "text.primary"}
//                   >
//                     {n.title}
//                   </Typography>
//                   <Typography variant="body2" sx={{ my: 0.5, color: n.isRead ? 'text.secondary' : 'text.primary' }}>
//                     {n.message}
//                   </Typography>
//                   <Typography variant="caption" sx={{ color: 'text.disabled' }}>
//                     {new Date(n.createdAt).toLocaleString("en-US", {
//                       month: "short",
//                       day: "numeric",
//                       hour: "2-digit",
//                       minute: "2-digit"
//                     })}
//                   </Typography>
//                 </Box>

//                 {/* Actions */}
//                 <Box>
//                   {!n.isRead ? (
//                     <Tooltip title="Mark as Read">
//                       <IconButton 
//                         size="small" 
//                         color="primary" 
//                         onClick={() => handleMarkRead(n.id)}
//                         disabled={processingId === n.id}
//                       >
//                         {processingId === n.id ? (
//                           <CircularProgress size={20} color="inherit" />
//                         ) : (
//                           <DoneAllIcon />
//                         )}
//                       </IconButton>
//                     </Tooltip>
//                   ) : (
//                     <Chip label="Read" size="small" variant="outlined" disabled sx={{ opacity: 0.5 }} />
//                   )}
//                 </Box>
//               </Stack>
//               {index < notifications.length - 1 && <Divider />}
//             </React.Fragment>
//           ))
//         )}
//       </Card>
      
//       <Typography variant="caption" display="block" textAlign="center" sx={{ mt: 3, color: 'text.disabled' }}>
//         Preview Mode: Using static mock data.
//       </Typography>
//     </Container>
//   );
// }