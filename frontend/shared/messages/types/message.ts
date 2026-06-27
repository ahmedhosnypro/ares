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
import type { LogoutDialogLabels } from "./dashboard/logout-dialog";
import type { DeleteNotificationDialogLabels } from "./delete-notification-dialog";

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
  readonly logoutDialog: LogoutDialogLabels;
};

export type MessageSchema = {
  readonly common: CommonLabels;
  readonly auth: AuthLabels;
  readonly errors: ErrorsLabels;
  readonly authPages: AuthPagesSchema;
  readonly customer: CustomerSchema;
  readonly header: HeaderLabels;
  readonly dashboard: DashboardSchema;
  readonly deleteNotificationDialog: DeleteNotificationDialogLabels;
};
