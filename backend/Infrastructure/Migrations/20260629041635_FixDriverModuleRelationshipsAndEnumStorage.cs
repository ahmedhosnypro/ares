using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixDriverModuleRelationshipsAndEnumStorage : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_driver_earnings_Bookings_BookingId1",
                table: "driver_earnings");

            migrationBuilder.DropForeignKey(
                name: "FK_driver_earnings_driver_payouts_PayoutId",
                table: "driver_earnings");

            migrationBuilder.DropForeignKey(
                name: "FK_driver_earnings_driver_profiles_DriverProfileId1",
                table: "driver_earnings");

            migrationBuilder.DropForeignKey(
                name: "FK_driver_payment_info_driver_profiles_DriverProfileId1",
                table: "driver_payment_info");

            migrationBuilder.DropForeignKey(
                name: "FK_driver_payouts_driver_profiles_DriverProfileId1",
                table: "driver_payouts");

            migrationBuilder.DropIndex(
                name: "IX_driver_payouts_DriverProfileId1",
                table: "driver_payouts");

            migrationBuilder.DropIndex(
                name: "IX_driver_payment_info_DriverProfileId",
                table: "driver_payment_info");

            migrationBuilder.DropIndex(
                name: "IX_driver_payment_info_DriverProfileId1",
                table: "driver_payment_info");

            migrationBuilder.DropIndex(
                name: "IX_driver_earnings_BookingId",
                table: "driver_earnings");

            migrationBuilder.DropIndex(
                name: "IX_driver_earnings_BookingId1",
                table: "driver_earnings");

            migrationBuilder.DropIndex(
                name: "IX_driver_earnings_DriverProfileId1",
                table: "driver_earnings");

            migrationBuilder.DropIndex(
                name: "IX_DiscountValidationLogs_DiscountId",
                table: "DiscountValidationLogs");

            migrationBuilder.DropColumn(
                name: "DriverProfileId1",
                table: "driver_payouts");

            migrationBuilder.DropColumn(
                name: "DriverProfileId1",
                table: "driver_payment_info");

            migrationBuilder.DropColumn(
                name: "BookingId1",
                table: "driver_earnings");

            migrationBuilder.DropColumn(
                name: "DriverProfileId1",
                table: "driver_earnings");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "driver_earnings",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.Sql(
                "UPDATE driver_earnings SET Status = CASE Status " +
                "WHEN '0' THEN 'Available' WHEN '1' THEN 'PendingPayout' " +
                "WHEN '2' THEN 'Paid' WHEN '3' THEN 'Reversed' END " +
                "WHERE Status IN ('0','1','2','3')");

            migrationBuilder.AlterColumn<string>(
                name: "Status",
                table: "driver_payouts",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.Sql(
                "UPDATE driver_payouts SET Status = CASE Status " +
                "WHEN '0' THEN 'Requested' WHEN '1' THEN 'Approved' " +
                "WHEN '2' THEN 'Processing' WHEN '3' THEN 'Completed' " +
                "WHEN '4' THEN 'Rejected' WHEN '5' THEN 'Failed' END " +
                "WHERE Status IN ('0','1','2','3','4','5')");

            migrationBuilder.AlterColumn<string>(
                name: "PayoutMethod",
                table: "driver_payment_info",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: false,
                oldClrType: typeof(int),
                oldType: "int");

            migrationBuilder.Sql(
                "UPDATE driver_payment_info SET PayoutMethod = CASE PayoutMethod " +
                "WHEN '0' THEN 'Wallet' END " +
                "WHERE PayoutMethod IN ('0')");

            migrationBuilder.CreateIndex(
                name: "IX_driver_payment_info_DriverProfileId",
                table: "driver_payment_info",
                column: "DriverProfileId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_driver_earnings_BookingId",
                table: "driver_earnings",
                column: "BookingId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DiscountValidationLogs_DiscountId_ValidatedAt",
                table: "DiscountValidationLogs",
                columns: new[] { "DiscountId", "ValidatedAt" });

            migrationBuilder.CreateIndex(
                name: "IX_DiscountCodes_Code",
                table: "DiscountCodes",
                column: "Code",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_DiscountCodes_IsActive_IsAutomatic_ValidFrom_ValidTo",
                table: "DiscountCodes",
                columns: new[] { "IsActive", "IsAutomatic", "ValidFrom", "ValidTo" });

            migrationBuilder.AddForeignKey(
                name: "FK_driver_earnings_driver_payouts_PayoutId",
                table: "driver_earnings",
                column: "PayoutId",
                principalTable: "driver_payouts",
                principalColumn: "Id",
                onDelete: ReferentialAction.Restrict);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropForeignKey(
                name: "FK_driver_earnings_driver_payouts_PayoutId",
                table: "driver_earnings");

            migrationBuilder.DropIndex(
                name: "IX_driver_payment_info_DriverProfileId",
                table: "driver_payment_info");

            migrationBuilder.DropIndex(
                name: "IX_driver_earnings_BookingId",
                table: "driver_earnings");

            migrationBuilder.DropIndex(
                name: "IX_DiscountValidationLogs_DiscountId_ValidatedAt",
                table: "DiscountValidationLogs");

            migrationBuilder.DropIndex(
                name: "IX_DiscountCodes_Code",
                table: "DiscountCodes");

            migrationBuilder.DropIndex(
                name: "IX_DiscountCodes_IsActive_IsAutomatic_ValidFrom_ValidTo",
                table: "DiscountCodes");

            migrationBuilder.Sql(
                "UPDATE driver_payouts SET Status = CASE Status " +
                "WHEN 'Requested' THEN 0 WHEN 'Approved' THEN 1 " +
                "WHEN 'Processing' THEN 2 WHEN 'Completed' THEN 3 " +
                "WHEN 'Rejected' THEN 4 WHEN 'Failed' THEN 5 END " +
                "WHERE Status IN ('Requested','Approved','Processing','Completed','Rejected','Failed')");

            migrationBuilder.AlterColumn<int>(
                name: "Status",
                table: "driver_payouts",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20);

            migrationBuilder.AddColumn<Guid>(
                name: "DriverProfileId1",
                table: "driver_payouts",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.Sql(
                "UPDATE driver_payment_info SET PayoutMethod = CASE PayoutMethod " +
                "WHEN 'Wallet' THEN 0 END " +
                "WHERE PayoutMethod IN ('Wallet')");

            migrationBuilder.AlterColumn<int>(
                name: "PayoutMethod",
                table: "driver_payment_info",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20);

            migrationBuilder.AddColumn<Guid>(
                name: "DriverProfileId1",
                table: "driver_payment_info",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.Sql(
                "UPDATE driver_earnings SET Status = CASE Status " +
                "WHEN 'Available' THEN 0 WHEN 'PendingPayout' THEN 1 " +
                "WHEN 'Paid' THEN 2 WHEN 'Reversed' THEN 3 END " +
                "WHERE Status IN ('Available','PendingPayout','Paid','Reversed')");

            migrationBuilder.AlterColumn<int>(
                name: "Status",
                table: "driver_earnings",
                type: "int",
                nullable: false,
                oldClrType: typeof(string),
                oldType: "nvarchar(20)",
                oldMaxLength: 20);

            migrationBuilder.AddColumn<Guid>(
                name: "BookingId1",
                table: "driver_earnings",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.AddColumn<Guid>(
                name: "DriverProfileId1",
                table: "driver_earnings",
                type: "uniqueidentifier",
                nullable: true);

            migrationBuilder.CreateIndex(
                name: "IX_driver_payouts_DriverProfileId1",
                table: "driver_payouts",
                column: "DriverProfileId1");

            migrationBuilder.CreateIndex(
                name: "IX_driver_payment_info_DriverProfileId",
                table: "driver_payment_info",
                column: "DriverProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_driver_payment_info_DriverProfileId1",
                table: "driver_payment_info",
                column: "DriverProfileId1",
                unique: true,
                filter: "[DriverProfileId1] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_driver_earnings_BookingId",
                table: "driver_earnings",
                column: "BookingId");

            migrationBuilder.CreateIndex(
                name: "IX_driver_earnings_BookingId1",
                table: "driver_earnings",
                column: "BookingId1",
                unique: true,
                filter: "[BookingId1] IS NOT NULL");

            migrationBuilder.CreateIndex(
                name: "IX_driver_earnings_DriverProfileId1",
                table: "driver_earnings",
                column: "DriverProfileId1");

            migrationBuilder.CreateIndex(
                name: "IX_DiscountValidationLogs_DiscountId",
                table: "DiscountValidationLogs",
                column: "DiscountId");

            migrationBuilder.AddForeignKey(
                name: "FK_driver_earnings_Bookings_BookingId1",
                table: "driver_earnings",
                column: "BookingId1",
                principalTable: "Bookings",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_driver_earnings_driver_payouts_PayoutId",
                table: "driver_earnings",
                column: "PayoutId",
                principalTable: "driver_payouts",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_driver_earnings_driver_profiles_DriverProfileId1",
                table: "driver_earnings",
                column: "DriverProfileId1",
                principalTable: "driver_profiles",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_driver_payment_info_driver_profiles_DriverProfileId1",
                table: "driver_payment_info",
                column: "DriverProfileId1",
                principalTable: "driver_profiles",
                principalColumn: "Id");

            migrationBuilder.AddForeignKey(
                name: "FK_driver_payouts_driver_profiles_DriverProfileId1",
                table: "driver_payouts",
                column: "DriverProfileId1",
                principalTable: "driver_profiles",
                principalColumn: "Id");
        }
    }
}
