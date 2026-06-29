"use client";

import {
  Card,
  TableContainer,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  TableFooter,
  Stack,
  Avatar,
  Box,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Pagination,
  alpha,
  useTheme,
  type Theme,
} from "@mui/material";
import { useTranslations } from "next-intl";
import { Link } from "@/shared/i18n/routing";
import SearchIcon from "@mui/icons-material/Search";
import VisibilityOutlinedIcon from "@mui/icons-material/LaunchOutlined";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import BlockIcon from "@mui/icons-material/Block";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import DeleteOutlinedIcon from "@mui/icons-material/DeleteOutlined";
import { toggleUserStatus, type User } from "@/api-clients/users/users";
import { logger } from "@/utils/logger";

interface UserTableDesktopProps {
  readonly users: User[];
  readonly page: number;
  readonly totalPages: number;
  readonly totalCount: number;
  readonly onPageChange: (page: number) => void;
  readonly onRefresh: () => void;
  readonly onRequestDelete: (user: User) => void;
}

export default function UserTableDesktop({
  users,
  page,
  totalPages,
  totalCount,
  onPageChange,
  onRefresh,
  onRequestDelete,
}: UserTableDesktopProps) {
  const theme = useTheme();
  const t = useTranslations("dashboardAdmin.users");

  return (
    <Card elevation={0} sx={{ borderRadius: 2, border: "1px solid", borderColor: "divider", overflow: "hidden" }}>
      <TableContainer sx={{ maxHeight: 600 }}>
        <Table stickyHeader sx={{ minWidth: 800 }}>
          {/* ── Header ── */}
          <TableHead>
            <TableRow
              sx={{
                "& .MuiTableCell-head": {
                  fontWeight: 700,
                  fontSize: 13,
                  textTransform: "uppercase",
                  letterSpacing: "0.05em",
                  color: "text.secondary",
                  borderBottom: "1px solid",
                  borderColor: "divider",
                  py: 2.5,
                  bgcolor: (rowTheme: Theme) => alpha(rowTheme.palette.primary.main, 0.03),
                },
              }}
            >
              <TableCell sx={{ pl: 3 }}>{t("table.user")}</TableCell>
              <TableCell>{t("table.contact")}</TableCell>
              <TableCell>{t("table.roles")}</TableCell>
              <TableCell>{t("table.status")}</TableCell>
              <TableCell align="right" sx={{ pr: 3 }}>
                {t("table.actions")}
              </TableCell>
            </TableRow>
          </TableHead>

          {/* ── Body ── */}
          <TableBody>
            {users.length > 0 ? (
              users.map(u => {
                const isActive = (u.status || "").toLowerCase() === "active";

                const handleStatusClick = async () => {
                  try {
                    await toggleUserStatus(u.id);
                    onRefresh();
                  } catch (err) {
                    logger.error("Failed to toggle status", err);
                  }
                };

                return (
                  <TableRow
                    key={u.id}
                    hover
                    sx={{
                      transition: "background 0.2s ease",
                      "&:last-child td": { border: 0 },
                      "&:hover": { bgcolor: "action.hover" },
                    }}
                  >
                    {/* User column */}
                    <TableCell sx={{ pl: 3, py: 2 }}>
                      <Stack direction="row" spacing={2} sx={{ alignItems: "center" }}>
                        <Avatar
                          src={(u.avatarUrl as string) || undefined}
                          sx={{
                            bgcolor: theme.palette.primary.light,
                            fontWeight: 700,
                            width: 40,
                            height: 40,
                            fontSize: 16,
                          }}
                        >
                          {u.firstName[0]}
                          {u.lastName[0]}
                        </Avatar>
                        <Box>
                          <Typography sx={{ fontWeight: 600, fontSize: 14 }}>
                            {u.firstName} {u.lastName}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {u.email}
                          </Typography>
                        </Box>
                      </Stack>
                    </TableCell>

                    {/* Contact column */}
                    <TableCell sx={{ py: 2 }}>
                      <Typography variant="body2" color="text.secondary">
                        {u.phoneNumber || "—"}
                      </Typography>
                    </TableCell>

                    {/* Roles column */}
                    <TableCell sx={{ py: 2 }}>
                      <Typography variant="body2" sx={{ textTransform: "capitalize", fontWeight: 500 }}>
                        {u.roles.map(r => t(`form.roles.${r.toLowerCase()}`)).join(", ") || "—"}
                      </Typography>
                    </TableCell>

                    {/* Status column */}
                    <TableCell sx={{ py: 2 }}>
                      <Chip
                        label={isActive ? t("form.active") : t("form.blocked")}
                        size="small"
                        sx={{
                          textTransform: "capitalize",
                          bgcolor: isActive
                            ? alpha(theme.palette.success.main, 0.15)
                            : alpha(theme.palette.error.main, 0.15),
                          color: isActive ? theme.palette.success.main : theme.palette.error.main,
                          fontWeight: 700,
                          fontSize: 12,
                        }}
                      />
                    </TableCell>

                    {/* Actions column */}
                    <TableCell align="right" sx={{ pr: 3, py: 2 }}>
                      <Stack direction="row" spacing={0.5} sx={{ justifyContent: "flex-end" }}>
                        <Tooltip title={t("table.viewDetails")}>
                          <IconButton component={Link} href={`/admin/users/${u.id}`} size="small">
                            <VisibilityOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title={t("table.editAccount")}>
                          <IconButton
                            component={Link}
                            href={`/admin/users/${u.id}/edit`}
                            size="small"
                            sx={{ display: { xs: "none", sm: "inline-flex" } }}
                          >
                            <EditOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>

                        <Tooltip title={isActive ? t("form.blocked") : t("form.active")}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              void handleStatusClick();
                            }}
                            sx={{ color: isActive ? "error.main" : "success.main" }}
                          >
                            {isActive ? <BlockIcon fontSize="small" /> : <CheckCircleIcon fontSize="small" />}
                          </IconButton>
                        </Tooltip>

                        <Tooltip title={t("table.delete")}>
                          <IconButton
                            size="small"
                            onClick={() => {
                              onRequestDelete(u);
                            }}
                            sx={{ color: "error.main" }}
                          >
                            <DeleteOutlinedIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      </Stack>
                    </TableCell>
                  </TableRow>
                );
              })
            ) : (
              /* Empty state */
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 10 }}>
                  <Box sx={{ textAlign: "center", opacity: 0.6 }}>
                    <SearchIcon sx={{ fontSize: 60, mb: 2, color: "text.disabled" }} />
                    <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 700 }}>
                      {t("table.noUsers")}
                    </Typography>
                    <Typography variant="body2" color="text.disabled">
                      {t("table.noUsersDesc")}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>

          {/* ── Footer / pagination ── */}
          <TableFooter>
            <TableRow>
              <TableCell colSpan={3} sx={{ pl: 3 }}>
                <Typography variant="caption" color="text.secondary">
                  {t("table.showingCount", { count: users.length, total: totalCount })}
                </Typography>
              </TableCell>
              <TableCell colSpan={2} align="right" sx={{ pr: 3 }}>
                {totalPages > 1 && (
                  <Pagination
                    count={totalPages}
                    page={page}
                    onChange={(_, v) => {
                      onPageChange(v);
                    }}
                    size="small"
                    siblingCount={0}
                    sx={{ "& .MuiPaginationItem-root": { borderRadius: 2 } }}
                  />
                )}
              </TableCell>
            </TableRow>
          </TableFooter>
        </Table>
      </TableContainer>
    </Card>
  );
}
