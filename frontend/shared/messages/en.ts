import type { MessageSchema } from "./types/message";
import common from "./en/common";
import auth from "./en/auth";
import errors from "./en/errors";
import signin from "./en/auth/signin";
import googleSignIn from "./en/auth/google-signin";
import signup from "./en/auth/signup";
import forgotPassword from "./en/auth/forgot-password";
import resetPassword from "./en/auth/reset-password";
import activate from "./en/auth/activate";
import verifyEmail from "./en/auth/verify-email";
import accountProfile from "./en/customer/account-profile";
import accountBookings from "./en/customer/account-bookings";
import bookingDetail from "./en/customer/booking-detail";
import driverSelection from "./en/customer/driver-selection";
import bookingPayment from "./en/customer/booking-payment";
import bookings from "./en/customer/bookings";
import changePassword from "./en/customer/change-password";
import notifications from "./en/customer/notifications";
import header from "./en/header";
import shell from "./en/dashboard/shell";
import adminSidebar from "./en/dashboard/admin-sidebar";
import driverSidebar from "./en/dashboard/driver-sidebar";
import supplierSidebar from "./en/dashboard/supplier-sidebar";
import inspectorSidebar from "./en/dashboard/inspector-sidebar";
import { driverCompleteProfile } from "./en/dashboard/driver-complete-profile";
import { driverDashboard } from "./en/dashboard/driver-dashboard";
import { driverEarnings } from "./en/dashboard/driver-earnings";
import { driverNotifications } from "./en/dashboard/driver-notifications";
import { driverProfile } from "./en/dashboard/driver-profile";
import logoutDialog from "./en/dashboard/logout-dialog";
import deleteNotificationDialog from "./en/delete-notification-dialog";

const en: MessageSchema = {
  common,
  auth,
  errors,
  authPages: {
    signin,
    googleSignIn,
    signup,
    forgotPassword,
    resetPassword,
    activate,
    verifyEmail,
  },
  customer: {
    accountProfile,
    accountBookings,
    bookingDetail,
    driverSelection,
    bookingPayment,
    bookings,
    changePassword,
    notifications,
  },
  header,
  dashboard: {
    shell,
    adminSidebar,
    driverSidebar,
    supplierSidebar,
    inspectorSidebar,
    driverCompleteProfile,
    driverDashboard,
    driverEarnings,
    driverNotifications,
    driverProfile,
    logoutDialog,
  },
  deleteNotificationDialog,
};

export default en;
