using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddGoogleAuthFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // GoogleId — stable, unique per Google account. Nullable because
            // most existing rows (email/password users) won't have one.
            migrationBuilder.AddColumn<string>(
                name: "GoogleId",
                table: "AspNetUsers",
                type: "nvarchar(64)",
                maxLength: 64,
                nullable: true);

            // AuthProvider — "Local" or "Google". Default "Local" so existing
            // rows are correctly classified after the migration runs.
            migrationBuilder.AddColumn<string>(
                name: "AuthProvider",
                table: "AspNetUsers",
                type: "nvarchar(20)",
                maxLength: 20,
                nullable: true,
                defaultValue: "Local");

            // EmailVerifiedAt — set automatically when a user signs in via
            // Google (Google has already verified the address).
            migrationBuilder.AddColumn<DateTime>(
                name: "EmailVerifiedAt",
                table: "AspNetUsers",
                type: "datetime2",
                nullable: true);

            // Backfill: any user whose email Identity already considers
            // confirmed gets a verified-at timestamp so the column stays
            // consistent for future queries.
            migrationBuilder.Sql(
                "UPDATE [AspNetUsers] SET [EmailVerifiedAt] = [CreatedAt] " +
                "WHERE [EmailConfirmed] = 1 AND [EmailVerifiedAt] IS NULL;");

            // Filtered unique index — allows many NULLs (most users) but
            // enforces uniqueness for the rows that have a GoogleId.
            migrationBuilder.CreateIndex(
                name: "IX_AspNetUsers_GoogleId",
                table: "AspNetUsers",
                column: "GoogleId",
                unique: true,
                filter: "[GoogleId] IS NOT NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropIndex(
                name: "IX_AspNetUsers_GoogleId",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "EmailVerifiedAt",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "AuthProvider",
                table: "AspNetUsers");

            migrationBuilder.DropColumn(
                name: "GoogleId",
                table: "AspNetUsers");
        }
    }
}
