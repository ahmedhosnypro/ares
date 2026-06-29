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
import changePassword from "./ar/customer/change-password";
import notifications from "./ar/customer/notifications";
import header from "./ar/header";
import shell from "./ar/dashboard/shell";
import adminSidebar from "./ar/dashboard/admin-sidebar";
import driverSidebar from "./ar/dashboard/driver-sidebar";
import supplierSidebar from "./ar/dashboard/supplier-sidebar";
import inspectorSidebar from "./ar/dashboard/inspector-sidebar";
import { driverCompleteProfile } from "./ar/dashboard/driver-complete-profile";
import { driverDashboard } from "./ar/dashboard/driver-dashboard";
import { driverEarnings } from "./ar/dashboard/driver-earnings";
import { driverNotifications } from "./ar/dashboard/driver-notifications";
import { driverProfile } from "./ar/dashboard/driver-profile";
import { driverTrips } from "./ar/dashboard/driver-trips";
import { supplierDashboard } from "./ar/dashboard/supplier/dashboard";
import { supplierEarnings } from "./ar/dashboard/supplier/earnings";
import { supplierNotifications } from "./ar/dashboard/supplier/notifications";
import { supplierReviews } from "./ar/dashboard/supplier/reviews";
import { supplierBookings } from "./ar/dashboard/supplier/bookings";
import { supplierBookingDetail } from "./ar/dashboard/supplier/bookings/_id";
import { supplierVehicles } from "./ar/dashboard/supplier/vehicles";
import { createSupplierVehicle } from "./ar/dashboard/supplier/vehicles/create";
import { supplierVehicleDetail } from "./ar/dashboard/supplier/vehicles/_id";
import logoutDialog from "./ar/dashboard/logout-dialog";
import deleteNotificationDialog from "./ar/delete-notification-dialog";
import compliance from "./ar/dashboard/admin/admin/compliance";
import security from "./ar/dashboard/admin/admin/security";
import vehicles from "./ar/dashboard/admin/admin/vehicles";
import bankDetails from "./ar/dashboard/admin/bank-details";
import about from "./ar/public/about";
import search from "./ar/public/search";
import locations from "./ar/public/locations";
import cookiePolicy from "./ar/public/cookie-policy";
import privacy from "./ar/public/privacy";
import terms from "./ar/public/terms";
import offers from "./ar/public/offers";
import faq from "./ar/public/faq";
import checkoutSession from "./ar/public/checkout-session";
import contact from "./ar/public/contact";
import confirmation from "./ar/public/bookings/confirmation";
import checkout from "./ar/public/checkout";
import publicBookings from "./ar/public/bookings";
import adminBookings from "./ar/dashboard/admin/bookings";
import createBooking from "./ar/dashboard/admin/bookings/create";
import bookingDetails from "./ar/dashboard/admin/bookings/_id/details";
import editBooking from "./ar/dashboard/admin/bookings/_id/edit";
import categories from "./ar/dashboard/admin/categories";
import categoryDetails from "./ar/dashboard/admin/categories/detail";
import countries from "./ar/dashboard/admin/countries";
import createCountry from "./ar/dashboard/admin/countries/create";
import countryDetails from "./ar/dashboard/admin/countries/_id/details";
import editCountry from "./ar/dashboard/admin/countries/_id/edit";
import locationsEdit from "./ar/dashboard/admin/locations/edit";
import adminNotifications from "./ar/dashboard/admin/notifications";
import scheduler from "./ar/dashboard/admin/scheduler";
import settings from "./ar/dashboard/admin/settings";
import users from "./ar/dashboard/admin/users";
import drivers from "./ar/dashboard/admin/drivers";
import inspectors from "./ar/dashboard/admin/inspectors";
import vehiclesAdmin from "./ar/dashboard/admin/vehicles";
import verifications from "./ar/dashboard/admin/verifications";
import promotions from "./ar/dashboard/admin/promotions";
import inspectorHistory from "./ar/dashboard/inspector/history";
import inspectorInspections from "./ar/dashboard/inspector/inspections";
import inspectorInspectionDetail from "./ar/dashboard/inspector/inspection-detail";
import inspectorProfile from "./ar/dashboard/inspector/profile";
import notFound from "./ar/root/not-found";
import errorPage from "./ar/root/error";
import loadingPage from "./ar/root/loading";
import supplierDetail from "./ar/public/suppliers/_supplierId";
import suppliers from "./ar/public/suppliers";
import vehicleDetail from "./ar/public/vehicles/_vehicleId";
import vehiclesList from "./ar/public/vehicles";

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
    countryDetails,
    editCountry,
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

export default ar;
