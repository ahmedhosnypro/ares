using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Data.Migrations
{
    /// <inheritdoc />
    public partial class AddDriverEarningsTables : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "driver_payouts",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DriverProfileId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    RequestedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    ReviewedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ReviewedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    RejectionReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ProcessedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    PaymobTransactionId = table.Column<string>(type: "nvarchar(100)", maxLength: 100, nullable: true),
                    PaymobPayoutId = table.Column<long>(type: "bigint", nullable: true),
                    FailureReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_driver_payouts", x => x.Id);
                    table.ForeignKey(
                        name: "FK_driver_payouts_driver_profiles_DriverProfileId",
                        column: x => x.DriverProfileId,
                        principalTable: "driver_profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_driver_payouts_AspNetUsers_ReviewedBy",
                        column: x => x.ReviewedBy,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "driver_earnings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    BookingId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DriverProfileId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    GrossEarning = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    PlatformDeduction = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    NetEarning = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    Status = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    PayoutId = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ReversedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    EarnedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_driver_earnings", x => x.Id);
                    table.ForeignKey(
                        name: "FK_driver_earnings_Bookings_BookingId",
                        column: x => x.BookingId,
                        principalTable: "Bookings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_driver_earnings_driver_profiles_DriverProfileId",
                        column: x => x.DriverProfileId,
                        principalTable: "driver_profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                    table.ForeignKey(
                        name: "FK_driver_earnings_driver_payouts_PayoutId",
                        column: x => x.PayoutId,
                        principalTable: "driver_payouts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "driver_payout_transactions",
                columns: table => new
                {
                    DriverPayoutId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DriverEarningId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    Amount = table.Column<decimal>(type: "decimal(18,2)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_driver_payout_transactions", x => new { x.DriverPayoutId, x.DriverEarningId });
                    table.ForeignKey(
                        name: "FK_driver_payout_transactions_driver_payouts_DriverPayoutId",
                        column: x => x.DriverPayoutId,
                        principalTable: "driver_payouts",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_driver_payout_transactions_driver_earnings_DriverEarningId",
                        column: x => x.DriverEarningId,
                        principalTable: "driver_earnings",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "driver_payment_info",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    DriverProfileId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    PayoutMethod = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    WalletPhoneNumber = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false),
                    IsVerified = table.Column<bool>(type: "bit", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_driver_payment_info", x => x.Id);
                    table.ForeignKey(
                        name: "FK_driver_payment_info_driver_profiles_DriverProfileId",
                        column: x => x.DriverProfileId,
                        principalTable: "driver_profiles",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_driver_payouts_DriverProfileId",
                table: "driver_payouts",
                column: "DriverProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_driver_payouts_ReviewedBy",
                table: "driver_payouts",
                column: "ReviewedBy");

            migrationBuilder.CreateIndex(
                name: "IX_driver_earnings_BookingId",
                table: "driver_earnings",
                column: "BookingId",
                unique: true);

            migrationBuilder.CreateIndex(
                name: "IX_driver_earnings_DriverProfileId",
                table: "driver_earnings",
                column: "DriverProfileId");

            migrationBuilder.CreateIndex(
                name: "IX_driver_earnings_PayoutId",
                table: "driver_earnings",
                column: "PayoutId");

            migrationBuilder.CreateIndex(
                name: "IX_driver_payout_transactions_DriverEarningId",
                table: "driver_payout_transactions",
                column: "DriverEarningId");

            migrationBuilder.CreateIndex(
                name: "IX_driver_payment_info_DriverProfileId",
                table: "driver_payment_info",
                column: "DriverProfileId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "driver_payout_transactions");

            migrationBuilder.DropTable(
                name: "driver_payment_info");

            migrationBuilder.DropTable(
                name: "driver_earnings");

            migrationBuilder.DropTable(
                name: "driver_payouts");
        }
    }
}
