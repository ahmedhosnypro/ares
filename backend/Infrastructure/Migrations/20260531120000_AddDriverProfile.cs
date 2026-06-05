using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    /// <summary>
    /// Driver Module — Phase 1 (foundation).
    ///
    /// Creates the new <c>driver_profiles</c> table that backs the
    /// <c>DriverProfile</c> entity used by the Driver Module. This entity
    /// is intentionally separate from the legacy <c>Drivers</c> table
    /// (which stores the *customer's* driving license submission), so this
    /// migration is fully additive — no existing column, index, FK, or
    /// row is altered or removed.
    ///
    /// It also idempotently inserts the new <c>Driver</c> Identity role so
    /// the role exists immediately after the migration runs, even when the
    /// app hasn't yet booted to run <see cref="Backend.Infrastructure.Data.DbInitializer"/>.
    ///
    /// After applying this migration the team should regenerate the
    /// ModelSnapshot via:
    ///     dotnet ef migrations add SyncDriverProfileSnapshot \
    ///         --project Infrastructure --startup-project Api
    /// (or simply re-run `dotnet ef migrations add AddDriverProfile`
    /// from a clean snapshot — both paths converge on the same model.)
    /// </summary>
    public partial class AddDriverProfile : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "driver_profiles",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    UserId = table.Column<Guid>(type: "uniqueidentifier", nullable: false),
                    LicenseNumber = table.Column<string>(type: "nvarchar(50)", maxLength: 50, nullable: true),
                    LicenseExpiryDate = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LicenseImage = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    NationalIdFrontImage = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    NationalIdBackImage = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    Address = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    EmergencyContactName = table.Column<string>(type: "nvarchar(150)", maxLength: 150, nullable: true),
                    EmergencyContactPhone = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: true),
                    Status = table.Column<string>(type: "nvarchar(30)", maxLength: 30, nullable: false, defaultValue: "Incomplete"),
                    Availability = table.Column<string>(type: "nvarchar(20)", maxLength: 20, nullable: false, defaultValue: "Unavailable"),
                    IsActive = table.Column<bool>(type: "bit", nullable: false, defaultValue: true),
                    RejectionReason = table.Column<string>(type: "nvarchar(500)", maxLength: 500, nullable: true),
                    ReviewedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    ReviewedAt = table.Column<DateTime>(type: "datetime2", nullable: true),
                    LockedUntil = table.Column<DateTime>(type: "datetime2", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime2", nullable: false, defaultValueSql: "SYSUTCDATETIME()"),
                    CreatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true),
                    UpdatedBy = table.Column<Guid>(type: "uniqueidentifier", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_driver_profiles", x => x.Id);
                    table.ForeignKey(
                        name: "FK_driver_profiles_AspNetUsers_UserId",
                        column: x => x.UserId,
                        principalTable: "AspNetUsers",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            // One profile per user.
            migrationBuilder.CreateIndex(
                name: "IX_driver_profiles_UserId",
                table: "driver_profiles",
                column: "UserId",
                unique: true);

            // Unique only when a license number has been submitted —
            // many Incomplete profiles (NULL license number) can coexist.
            migrationBuilder.CreateIndex(
                name: "IX_driver_profiles_LicenseNumber",
                table: "driver_profiles",
                column: "LicenseNumber",
                unique: true,
                filter: "[LicenseNumber] IS NOT NULL");

            // Eligibility scan: Verified + Available + IsActive.
            migrationBuilder.CreateIndex(
                name: "IX_driver_profiles_Status_Availability_IsActive",
                table: "driver_profiles",
                columns: new[] { "Status", "Availability", "IsActive" });

            // Idempotent insert of the new Identity role so the role
            // exists for self-service registration immediately after the
            // migration runs. Matches the role-seeding pattern in
            // DbInitializer.SeedRolesAsync, but for environments where
            // the seeder hasn't run yet.
            migrationBuilder.Sql(@"
IF NOT EXISTS (SELECT 1 FROM AspNetRoles WHERE NormalizedName = N'DRIVER')
BEGIN
    INSERT INTO AspNetRoles (Id, Name, NormalizedName, ConcurrencyStamp)
    VALUES (NEWID(), N'Driver', N'DRIVER', CAST(NEWID() AS nvarchar(36)));
END
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Remove the seeded role (only if no users still have it, to
            // avoid orphaning role assignments when rolling back).
            migrationBuilder.Sql(@"
IF EXISTS (SELECT 1 FROM AspNetRoles WHERE NormalizedName = N'DRIVER')
   AND NOT EXISTS (
       SELECT 1
       FROM AspNetUserRoles ur
       INNER JOIN AspNetRoles r ON r.Id = ur.RoleId
       WHERE r.NormalizedName = N'DRIVER')
BEGIN
    DELETE FROM AspNetRoles WHERE NormalizedName = N'DRIVER';
END
");

            migrationBuilder.DropTable(name: "driver_profiles");
        }
    }
}
