import auth from "./ar/auth";
import activate from "./ar/auth/activate";
import forgotPassword from "./ar/auth/forgot-password";
import googleSignIn from "./ar/auth/google-signin";
import resetPassword from "./ar/auth/reset-password";
import signin from "./ar/auth/signin";
import signup from "./ar/auth/signup";
import verifyEmail from "./ar/auth/verify-email";
import common from "./ar/common";
import accountBookings from "./ar/customer/account-bookings";
import accountProfile from "./ar/customer/account-profile";
import bookingDetail from "./ar/customer/booking-detail";
import bookingPayment from "./ar/customer/booking-payment";
import bookings from "./ar/customer/bookings";
import changePassword from "./ar/customer/change-password";
import driverSelection from "./ar/customer/driver-selection";
import notifications from "./ar/customer/notifications";
import compliance from "./ar/dashboard/admin/admin/compliance";
import security from "./ar/dashboard/admin/admin/security";
import vehicles from "./ar/dashboard/admin/admin/vehicles";
import bankDetails from "./ar/dashboard/admin/bank-details";
import adminBookings from "./ar/dashboard/admin/bookings";
import bookingDetails from "./ar/dashboard/admin/bookings/_id/details";
import editBooking from "./ar/dashboard/admin/bookings/_id/edit";
import createBooking from "./ar/dashboard/admin/bookings/create";
import categories from "./ar/dashboard/admin/categories";
import categoryDetails from "./ar/dashboard/admin/categories/detail";
import countries from "./ar/dashboard/admin/countries";
import countryDetails from "./ar/dashboard/admin/countries/_id/details";
import editCountry from "./ar/dashboard/admin/countries/_id/edit";
import createCountry from "./ar/dashboard/admin/countries/create";
import drivers from "./ar/dashboard/admin/drivers";
import inspectors from "./ar/dashboard/admin/inspectors";
import financialReports from "./ar/dashboard/admin/financial-reports";
import locationsForm from "./ar/dashboard/admin/locations/form";
import adminNotifications from "./ar/dashboard/admin/notifications";
import promotions from "./ar/dashboard/admin/promotions";
import scheduler from "./ar/dashboard/admin/scheduler";
import settings from "./ar/dashboard/admin/settings";
import users from "./ar/dashboard/admin/users";
import vehiclesAdmin from "./ar/dashboard/admin/vehicles";
import verifications from "./ar/dashboard/admin/verifications";
import adminSidebar from "./ar/dashboard/admin-sidebar";
import { driverCompleteProfile } from "./ar/dashboard/driver-complete-profile";
import { driverDashboard } from "./ar/dashboard/driver-dashboard";
import { driverEarnings } from "./ar/dashboard/driver-earnings";
import { driverNotifications } from "./ar/dashboard/driver-notifications";
import { driverProfile } from "./ar/dashboard/driver-profile";
import driverSidebar from "./ar/dashboard/driver-sidebar";
import { driverTrips } from "./ar/dashboard/driver-trips";
import inspectorHistory from "./ar/dashboard/inspector/history";
import inspectorInspectionDetail from "./ar/dashboard/inspector/inspection-detail";
import inspectorInspections from "./ar/dashboard/inspector/inspections";
import inspectorProfile from "./ar/dashboard/inspector/profile";
import inspectorSidebar from "./ar/dashboard/inspector-sidebar";
import logoutDialog from "./ar/dashboard/logout-dialog";
import shell from "./ar/dashboard/shell";
import { supplierBookings } from "./ar/dashboard/supplier/bookings";
import { supplierBookingDetail } from "./ar/dashboard/supplier/bookings/_id";
import { supplierDashboard } from "./ar/dashboard/supplier/dashboard";
import { supplierEarnings } from "./ar/dashboard/supplier/earnings";
import { supplierNotifications } from "./ar/dashboard/supplier/notifications";
import { supplierReviews } from "./ar/dashboard/supplier/reviews";
import { supplierVehicles } from "./ar/dashboard/supplier/vehicles";
import { supplierVehicleDetail } from "./ar/dashboard/supplier/vehicles/_id";
import { createSupplierVehicle } from "./ar/dashboard/supplier/vehicles/create";
import supplierSidebar from "./ar/dashboard/supplier-sidebar";
import deleteNotificationDialog from "./ar/delete-notification-dialog";
import errors from "./ar/errors";
import header from "./ar/header";
import about from "./ar/public/about";
import publicBookings from "./ar/public/bookings";
import confirmation from "./ar/public/bookings/confirmation";
import checkout from "./ar/public/checkout";
import checkoutSession from "./ar/public/checkout-session";
import contact from "./ar/public/contact";
import cookiePolicy from "./ar/public/cookie-policy";
import faq from "./ar/public/faq";
import locations from "./ar/public/locations";
import offers from "./ar/public/offers";
import privacy from "./ar/public/privacy";
import search from "./ar/public/search";
import suppliers from "./ar/public/suppliers";
import supplierDetail from "./ar/public/suppliers/_supplierId";
import terms from "./ar/public/terms";
import vehiclesList from "./ar/public/vehicles";
import vehicleDetail from "./ar/public/vehicles/_vehicleId";
import errorPage from "./ar/root/error";
import loadingPage from "./ar/root/loading";
import notFound from "./ar/root/not-found";
import type { MessageSchema } from "./types/message";

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

export default ar;
