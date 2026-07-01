import auth from "./en/auth";
import activate from "./en/auth/activate";
import forgotPassword from "./en/auth/forgot-password";
import googleSignIn from "./en/auth/google-signin";
import resetPassword from "./en/auth/reset-password";
import signin from "./en/auth/signin";
import signup from "./en/auth/signup";
import verifyEmail from "./en/auth/verify-email";
import common from "./en/common";
import accountBookings from "./en/customer/account-bookings";
import accountProfile from "./en/customer/account-profile";
import bookingDetail from "./en/customer/booking-detail";
import bookingPayment from "./en/customer/booking-payment";
import bookings from "./en/customer/bookings";
import changePassword from "./en/customer/change-password";
import driverSelection from "./en/customer/driver-selection";
import notifications from "./en/customer/notifications";
import compliance from "./en/dashboard/admin/admin/compliance";
import security from "./en/dashboard/admin/admin/security";
import vehicles from "./en/dashboard/admin/admin/vehicles";
import bankDetails from "./en/dashboard/admin/bank-details";
import adminBookings from "./en/dashboard/admin/bookings";
import bookingDetails from "./en/dashboard/admin/bookings/_id/details";
import editBooking from "./en/dashboard/admin/bookings/_id/edit";
import createBooking from "./en/dashboard/admin/bookings/create";
import categories from "./en/dashboard/admin/categories";
import categoryDetails from "./en/dashboard/admin/categories/detail";
import countries from "./en/dashboard/admin/countries";
import countryDetails from "./en/dashboard/admin/countries/_id/details";
import editCountry from "./en/dashboard/admin/countries/_id/edit";
import createCountry from "./en/dashboard/admin/countries/create";
import drivers from "./en/dashboard/admin/drivers";
import inspectors from "./en/dashboard/admin/inspectors";
import financialReports from "./en/dashboard/admin/financial-reports";
import locationsForm from "./en/dashboard/admin/locations/form";
import adminNotifications from "./en/dashboard/admin/notifications";
import promotions from "./en/dashboard/admin/promotions";
import scheduler from "./en/dashboard/admin/scheduler";
import settings from "./en/dashboard/admin/settings";
import users from "./en/dashboard/admin/users";
import vehiclesAdmin from "./en/dashboard/admin/vehicles";
import verifications from "./en/dashboard/admin/verifications";
import adminSidebar from "./en/dashboard/admin-sidebar";
import { driverCompleteProfile } from "./en/dashboard/driver-complete-profile";
import { driverDashboard } from "./en/dashboard/driver-dashboard";
import { driverEarnings } from "./en/dashboard/driver-earnings";
import { driverNotifications } from "./en/dashboard/driver-notifications";
import { driverProfile } from "./en/dashboard/driver-profile";
import driverSidebar from "./en/dashboard/driver-sidebar";
import { driverTrips } from "./en/dashboard/driver-trips";
import inspectorHistory from "./en/dashboard/inspector/history";
import inspectorInspectionDetail from "./en/dashboard/inspector/inspection-detail";
import inspectorInspections from "./en/dashboard/inspector/inspections";
import inspectorProfile from "./en/dashboard/inspector/profile";
import inspectorSidebar from "./en/dashboard/inspector-sidebar";
import logoutDialog from "./en/dashboard/logout-dialog";
import shell from "./en/dashboard/shell";
import { supplierBookings } from "./en/dashboard/supplier/bookings";
import { supplierBookingDetail } from "./en/dashboard/supplier/bookings/_id";
import { supplierDashboard } from "./en/dashboard/supplier/dashboard";
import { supplierEarnings } from "./en/dashboard/supplier/earnings";
import { supplierNotifications } from "./en/dashboard/supplier/notifications";
import { supplierReviews } from "./en/dashboard/supplier/reviews";
import { supplierVehicles } from "./en/dashboard/supplier/vehicles";
import { supplierVehicleDetail } from "./en/dashboard/supplier/vehicles/_id";
import { createSupplierVehicle } from "./en/dashboard/supplier/vehicles/create";
import supplierSidebar from "./en/dashboard/supplier-sidebar";
import deleteNotificationDialog from "./en/delete-notification-dialog";
import errors from "./en/errors";
import header from "./en/header";
import about from "./en/public/about";
import publicBookings from "./en/public/bookings";
import confirmation from "./en/public/bookings/confirmation";
import checkout from "./en/public/checkout";
import checkoutSession from "./en/public/checkout-session";
import contact from "./en/public/contact";
import cookiePolicy from "./en/public/cookie-policy";
import faq from "./en/public/faq";
import locations from "./en/public/locations";
import offers from "./en/public/offers";
import privacy from "./en/public/privacy";
import search from "./en/public/search";
import suppliers from "./en/public/suppliers";
import supplierDetail from "./en/public/suppliers/_supplierId";
import terms from "./en/public/terms";
import vehiclesList from "./en/public/vehicles";
import vehicleDetail from "./en/public/vehicles/_vehicleId";
import errorPage from "./en/root/error";
import loadingPage from "./en/root/loading";
import notFound from "./en/root/not-found";
import type { MessageSchema } from "./types/message";

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
    countryDetails,
    editCountry,
    locationsForm,
    notifications: adminNotifications,
    scheduler,
    settings,
    users,
    drivers,
    inspectors,
    financialReports,
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
