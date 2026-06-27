import type { MessageSchema } from "./types/message";
import common from "./ar/common";
import auth from "./ar/auth";
import errors from "./ar/errors";
import signin from "./ar/auth/signin";
import googleSignIn from "./ar/auth/google-signin";
import signup from "./ar/auth/signup";
import forgotPassword from "./ar/auth/forgot-password";
import resetPassword from "./ar/auth/reset-password";
import activate from "./ar/auth/activate";
import verifyEmail from "./ar/auth/verify-email";
import accountProfile from "./ar/customer/account-profile";
import accountBookings from "./ar/customer/account-bookings";
import bookingDetail from "./ar/customer/booking-detail";
import driverSelection from "./ar/customer/driver-selection";
import bookingPayment from "./ar/customer/booking-payment";
import bookings from "./ar/customer/bookings";
import header from "./ar/header";
import shell from "./ar/dashboard/shell";
import adminSidebar from "./ar/dashboard/admin-sidebar";
import driverSidebar from "./ar/dashboard/driver-sidebar";
import supplierSidebar from "./ar/dashboard/supplier-sidebar";
import inspectorSidebar from "./ar/dashboard/inspector-sidebar";
import logoutDialog from "./ar/dashboard/logout-dialog";
import deleteNotificationDialog from "./ar/delete-notification-dialog";
import compliance from "./ar/dashboard/admin/admin/compliance";
import security from "./ar/dashboard/admin/admin/security";
import vehicles from "./ar/dashboard/admin/admin/vehicles";
import bankDetails from "./ar/dashboard/admin/bank-details";
import adminBookings from "./ar/dashboard/admin/bookings";
import createBooking from "./ar/dashboard/admin/bookings/create";

const ar: MessageSchema = {
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
  },
  header,
  dashboard: {
    shell,
    adminSidebar,
    driverSidebar,
    supplierSidebar,
    inspectorSidebar,
    logoutDialog,
  },
  dashboardAdmin: {
    admin: {
      compliance,
      security,
      vehicles,
    },
    bankDetails,
    bookings: adminBookings,
    createBooking,
  },
  deleteNotificationDialog,
};

export default ar;
