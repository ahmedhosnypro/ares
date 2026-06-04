"use client";

import { Card, CardContent, Typography, Box, Badge, LinearProgress, Avatar } from "@mui/material";
import SettingsInputAntennaIcon from '@mui/icons-material/SettingsInputAntenna';
import PhonelinkRingIcon from '@mui/icons-material/PhonelinkRing';

export default function LiveTrackingWidget() {
  // Mock data for currently connected mobile devices
  const totalActiveRentals = 45;
  const connectedPhones = 42; 
  const connectionHealth = (connectedPhones / totalActiveRentals) * 100;

  return (
    <Card elevation={0} sx={{ borderRadius: 4, border: '1px solid', borderColor: 'divider', boxShadow: '0 4px 20px rgba(0,0,0,0.02)' }}>
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
          <Typography variant="h6" fontWeight="800">
            Live Mobile Tracking
          </Typography>
          <Badge color="success" variant="dot" sx={{ '& .MuiBadge-badge': { width: 10, height: 10, borderRadius: '50%', animation: 'pulse 1.5s infinite' } }}>
            <SettingsInputAntennaIcon color="action" />
          </Badge>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
          <Avatar sx={{ bgcolor: 'rgba(33, 150, 243, 0.1)', color: 'primary.main', width: 56, height: 56 }}>
            <PhonelinkRingIcon fontSize="large" />
          </Avatar>
          <Box>
            <Typography variant="h4" fontWeight="900">{connectedPhones} / {totalActiveRentals}</Typography>
            <Typography variant="body2" color="text.secondary" fontWeight="600">Active Phones Connected</Typography>
          </Box>
        </Box>

        <Box>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
            <Typography variant="caption" fontWeight="bold">WebSocket Health</Typography>
            <Typography variant="caption" fontWeight="bold" color="success.main">{Math.round(connectionHealth)}%</Typography>
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={connectionHealth} 
            color="success"
            sx={{ height: 8, borderRadius: 4, bgcolor: 'rgba(0,0,0,0.05)' }} 
          />
        </Box>
      </CardContent>
    </Card>
  );
}