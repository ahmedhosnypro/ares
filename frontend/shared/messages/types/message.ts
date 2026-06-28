import type { AuthLabels } from "./auth";
import type { ActivateLabels } from "./auth/activate";
import type { ForgotPasswordLabels } from "./auth/forgot-password";
import type { GoogleSignInLabels } from "./auth/google-signin";
import type { ResetPasswordLabels } from "./auth/reset-password";
import type { SignInLabels } from "./auth/signin";
import type { SignUpPageLabels } from "./auth/signup";
import type { VerifyEmailLabels } from "./auth/verify-email";
import type { AccountBookingsLabels } from "./customer/account-bookings";
import type { AccountProfileLabels } from "./customer/account-profile";
import type { BookingDetailLabels } from "./customer/booking-detail";
import type { BookingPaymentLabels } from "./customer/booking-payment";
import type { CustomerBookingsLabels } from "./customer/bookings";
import type { ChangePasswordLabels } from "./customer/change-password";
import type { CustomerNotificationsLabels } from "./customer/notifications";
import type { DriverSelectionLabels } from "./customer/driver-selection";
import type { CommonLabels } from "./common";
import type { ErrorsLabels } from "./errors";
import type { HeaderLabels } from "./header";
import type { AdminSidebarLabels } from "./dashboard/admin-sidebar";
import type { DriverSidebarLabels } from "./dashboard/driver-sidebar";
import type { SupplierSidebarLabels } from "./dashboard/supplier-sidebar";
import type { InspectorSidebarLabels } from "./dashboard/inspector-sidebar";
import type { DashboardLabels } from "./dashboard/shell";
import type { DriverCompleteProfileLabels } from "./dashboard/driver-complete-profile";
import type { DriverDashboardLabels } from "./dashboard/driver-dashboard";
import type { DriverEarningsLabels } from "./dashboard/driver-earnings";
import type { DriverNotificationsLabels } from "./dashboard/driver-notifications";
import type { DriverProfileLabels } from "./dashboard/driver-profile";
import type { DriverTripsLabels } from "./dashboard/driver-trips";
import type { LogoutDialogLabels } from "./dashboard/logout-dialog";
import type { DeleteNotificationDialogLabels } from "./delete-notification-dialog";
import type { AdminComplianceLabels } from "./dashboard/admin/admin/compliance";
import type { AdminSecurityLabels } from "./dashboard/admin/admin/security";
import type { AdminVehiclesMgmtLabels } from "./dashboard/admin/admin/vehicles";
import type { BankDetailsLabels } from "./dashboard/admin/bank-details";
import type { AboutLabels } from "./public/about";
import type { PrivacyLabels } from "./public/privacy";
import type { TermsLabels } from "./public/terms";
import type { AdminBookingsLabels } from "./dashboard/admin/bookings";
import type { CreateBookingLabels } from "./dashboard/admin/bookings/create";
import type { BookingDetailsLabels } from "./dashboard/admin/bookings/_id/details";
import type { EditBookingLabels } from "./dashboard/admin/bookings/_id/edit";
import type { CategoriesLabels } from "./dashboard/admin/categories";
import type { CategoryDetailsLabels } from "./dashboard/admin/categories/detail";
import type { CountriesLabels } from "./dashboard/admin/countries";
import type { CreateCountryLabels } from "./dashboard/admin/countries/create";

export type {
  AuthLabels,
  AccountBookingsLabels,
  AccountProfileLabels,
  ActivateLabels,
  BookingDetailLabels,
  BookingPaymentLabels,
  ChangePasswordLabels,
  CommonLabels,
  CustomerBookingsLabels,
  CustomerNotificationsLabels,
  DriverSelectionLabels,
  ErrorsLabels,
  ForgotPasswordLabels,
  GoogleSignInLabels,
  HeaderLabels,
  ResetPasswordLabels,
  SignInLabels,
  SignUpPageLabels,
  VerifyEmailLabels,
  AdminSidebarLabels,
  DriverSidebarLabels,
  SupplierSidebarLabels,
  InspectorSidebarLabels,
  DashboardLabels,
  LogoutDialogLabels,
  DeleteNotificationDialogLabels,
  AdminComplianceLabels,
  AdminSecurityLabels,
  AdminVehiclesMgmtLabels,
  BankDetailsLabels,
  DriverTripsLabels,
  DriverCompleteProfileLabels,
  DriverDashboardLabels,
  DriverEarningsLabels,
  DriverNotificationsLabels,
  DriverProfileLabels,
  BookingDetailsLabels,
  EditBookingLabels,
  CategoriesLabels,
  CategoryDetailsLabels,
  CountriesLabels,
  CreateCountryLabels,
  AboutLabels,
  PrivacyLabels,
  TermsLabels,
  AdminBookingsLabels,
  CreateBookingLabels,
};

export type AuthPagesSchema = {
  readonly signin: SignInLabels;
  readonly googleSignIn: GoogleSignInLabels;
  readonly signup: SignUpPageLabels;
  readonly forgotPassword: ForgotPasswordLabels;
  readonly resetPassword: ResetPasswordLabels;
  readonly activate: ActivateLabels;
  readonly verifyEmail: VerifyEmailLabels;
};

export type CustomerSchema = {
  readonly accountProfile: AccountProfileLabels;
  readonly accountBookings: AccountBookingsLabels;
  readonly bookingDetail: BookingDetailLabels;
  readonly driverSelection: DriverSelectionLabels;
  readonly bookingPayment: BookingPaymentLabels;
  readonly bookings: CustomerBookingsLabels;
  readonly changePassword: ChangePasswordLabels;
  readonly notifications: CustomerNotificationsLabels;
};

export type DashboardSchema = {
  readonly shell: DashboardLabels;
  readonly adminSidebar: AdminSidebarLabels;
  readonly driverSidebar: DriverSidebarLabels;
  readonly supplierSidebar: SupplierSidebarLabels;
  readonly inspectorSidebar: InspectorSidebarLabels;
  readonly driverCompleteProfile: DriverCompleteProfileLabels;
  readonly driverDashboard: DriverDashboardLabels;
  readonly driverEarnings: DriverEarningsLabels;
  readonly driverNotifications: DriverNotificationsLabels;
  readonly driverProfile: DriverProfileLabels;
  readonly driverTrips: DriverTripsLabels;
  readonly logoutDialog: LogoutDialogLabels;
};

export type DashboardAdminAdminSchema = {
  readonly compliance: AdminComplianceLabels;
  readonly security: AdminSecurityLabels;
  readonly vehicles: AdminVehiclesMgmtLabels;
};

export type DashboardAdminSchema = {
  readonly admin: DashboardAdminAdminSchema;
  readonly bankDetails: BankDetailsLabels;
  readonly bookings: AdminBookingsLabels;
  readonly createBooking: CreateBookingLabels;
  readonly bookingDetails: BookingDetailsLabels;
  readonly editBooking: EditBookingLabels;
  readonly categories: CategoriesLabels;
  readonly categoryDetails: CategoryDetailsLabels;
  readonly countries: CountriesLabels;
  readonly createCountry: CreateCountryLabels;
};

export type PublicPagesSchema = {
  readonly about: AboutLabels;
  readonly privacy: PrivacyLabels;
  readonly terms: TermsLabels;
};

export type MessageSchema = {
  readonly common: CommonLabels;
  readonly auth: AuthLabels;
  readonly errors: ErrorsLabels;
  readonly authPages: AuthPagesSchema;
  readonly customer: CustomerSchema;
  readonly header: HeaderLabels;
  readonly dashboard: DashboardSchema;
  readonly dashboardAdmin: DashboardAdminSchema;
  readonly deleteNotificationDialog: DeleteNotificationDialogLabels;
  readonly publicPages: PublicPagesSchema;
};
