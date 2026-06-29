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
import { driverTrips } from "./en/dashboard/driver-trips";
import { supplierDashboard } from "./en/dashboard/supplier/dashboard";
import { supplierEarnings } from "./en/dashboard/supplier/earnings";
import { supplierNotifications } from "./en/dashboard/supplier/notifications";
import { supplierReviews } from "./en/dashboard/supplier/reviews";
import { supplierBookings } from "./en/dashboard/supplier/bookings";
import { supplierBookingDetail } from "./en/dashboard/supplier/bookings/_id";
import { supplierVehicles } from "./en/dashboard/supplier/vehicles";
import { createSupplierVehicle } from "./en/dashboard/supplier/vehicles/create";
import { supplierVehicleDetail } from "./en/dashboard/supplier/vehicles/_id";
import logoutDialog from "./en/dashboard/logout-dialog";
import deleteNotificationDialog from "./en/delete-notification-dialog";
import compliance from "./en/dashboard/admin/admin/compliance";
import security from "./en/dashboard/admin/admin/security";
import vehicles from "./en/dashboard/admin/admin/vehicles";
import bankDetails from "./en/dashboard/admin/bank-details";
import about from "./en/public/about";
import search from "./en/public/search";
import cookiePolicy from "./en/public/cookie-policy";
import locations from "./en/public/locations";
import privacy from "./en/public/privacy";
import terms from "./en/public/terms";
import offers from "./en/public/offers";
import checkoutSession from "./en/public/checkout-session";
import faq from "./en/public/faq";
import contact from "./en/public/contact";
import confirmation from "./en/public/bookings/confirmation";
import checkout from "./en/public/checkout";
import publicBookings from "./en/public/bookings";
import adminBookings from "./en/dashboard/admin/bookings";
import createBooking from "./en/dashboard/admin/bookings/create";
import bookingDetails from "./en/dashboard/admin/bookings/_id/details";
import editBooking from "./en/dashboard/admin/bookings/_id/edit";
import categories from "./en/dashboard/admin/categories";
import categoryDetails from "./en/dashboard/admin/categories/detail";
import countries from "./en/dashboard/admin/countries";
import createCountry from "./en/dashboard/admin/countries/create";
import locationsEdit from "./en/dashboard/admin/locations/edit";
import adminNotifications from "./en/dashboard/admin/notifications";
import scheduler from "./en/dashboard/admin/scheduler";
import settings from "./en/dashboard/admin/settings";
import users from "./en/dashboard/admin/users";
import drivers from "./en/dashboard/admin/drivers";
import inspectors from "./en/dashboard/admin/inspectors";
import vehiclesAdmin from "./en/dashboard/admin/vehicles";
import verifications from "./en/dashboard/admin/verifications";
import promotions from "./en/dashboard/admin/promotions";
import inspectorHistory from "./en/dashboard/inspector/history";
import inspectorInspections from "./en/dashboard/inspector/inspections";
import inspectorInspectionDetail from "./en/dashboard/inspector/inspection-detail";
import inspectorProfile from "./en/dashboard/inspector/profile";
import notFound from "./en/root/not-found";
import errorPage from "./en/root/error";
import loadingPage from "./en/root/loading";
import supplierDetail from "./en/public/suppliers/_supplierId";
import suppliers from "./en/public/suppliers";
import vehicleDetail from "./en/public/vehicles/_vehicleId";
import vehiclesList from "./en/public/vehicles";

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
    driverTrips,
    supplierDashboard,
    supplierEarnings,
    supplierNotifications,
    supplierReviews,
    supplierBookings,
    supplierBookingDetail,
    supplierVehicles,
    createSupplierVehicle,
    supplierVehicleDetail,
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
    bookingDetails,
    editBooking,
    categories,
    categoryDetails,
    countries,
    createCountry,
    locationsEdit,
    notifications: adminNotifications,
    scheduler,
    settings,
    users,
    drivers,
    inspectors,
    vehicles: vehiclesAdmin,
    verifications,
    promotions,
  },
  dashboardInspector: {
    history: inspectorHistory,
    inspections: inspectorInspections,
    inspectionDetail: inspectorInspectionDetail,
    profile: inspectorProfile,
  },
  deleteNotificationDialog,
  publicPages: {
    about,
    privacy,
    terms,
    offers,
    bookings: {
      index: publicBookings,
      confirmation,
    },
    checkout,
    checkoutSession,
    contact,
    cookiePolicy,
    faq,
    locations,
    search,
    suppliers: {
      index: suppliers,
      detail: supplierDetail,
    },
    vehicles: {
      index: vehiclesList,
      detail: vehicleDetail,
    },
  },
  rootPages: {
    error: errorPage,
    loading: loadingPage,
    notFound,
  },
};

export default en;
