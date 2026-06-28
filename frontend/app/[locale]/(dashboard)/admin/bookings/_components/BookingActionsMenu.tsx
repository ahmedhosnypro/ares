"use client";

import { Menu, MenuItem, Divider, useTheme } from "@mui/material";
import {
  LaunchOutlined as ViewIcon,
  EditOutlined as EditIcon,
  SyncAltOutlined as ChangeStatusIcon,
  DeleteOutlined as DeleteIcon,
} from "@mui/icons-material";

interface BookingActionsMenuProps {
  readonly anchorEl: HTMLElement | null;
  readonly onClose: () => void;
  readonly onViewDetails: () => void;
  readonly onEdit: () => void;
  readonly onChangeStatus: () => void;
  readonly onDelete: () => void;
  readonly t: (key: string) => string;
}

export default function BookingActionsMenu({
  anchorEl,
  onClose,
  onViewDetails,
  onEdit,
  onChangeStatus,
  onDelete,
  t,
}: BookingActionsMenuProps) {
  const theme = useTheme();

  return (
    <Menu
      anchorEl={anchorEl}
      open={Boolean(anchorEl)}
      onClose={onClose}
      slotProps={{
        paper: {
          sx: {
            borderRadius: 2,
            minWidth: 180,
            boxShadow: theme.shadows[3],
          },
        },
      }}
    >
      <MenuItem onClick={onViewDetails} sx={{ fontSize: 14, gap: 1.5 }}>
        <ViewIcon fontSize="small" />
        {t("menu.viewDetails")}
      </MenuItem>
      <MenuItem onClick={onEdit} sx={{ fontSize: 14, gap: 1.5 }}>
        <EditIcon fontSize="small" />
        {t("menu.editBooking")}
      </MenuItem>
      <MenuItem onClick={onChangeStatus} sx={{ fontSize: 14, gap: 1.5 }}>
        <ChangeStatusIcon fontSize="small" />
        {t("menu.changeStatus")}
      </MenuItem>
      <Divider />
      <MenuItem
        onClick={onDelete}
        sx={{
          fontSize: 14,
          gap: 1.5,
          color: "error.main",
          fontWeight: 600,
        }}
      >
        <DeleteIcon fontSize="small" color="error" />
        {t("menu.deleteBooking")}
      </MenuItem>
    </Menu>
  );
}
