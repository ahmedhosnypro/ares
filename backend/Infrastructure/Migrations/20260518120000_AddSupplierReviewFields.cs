using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    /// <summary>
    /// Adds supplier-reply and supplier-report columns to the Reviews table so
    /// the new supplier dashboard can: (a) reply to customer reviews (one
    /// reply per review, editable), and (b) flag inappropriate reviews for
    /// later moderation. All columns are nullable / default-false to preserve
    /// backward compatibility with existing review rows that pre-date this
    /// feature.
    /// </summary>
    public partial class AddSupplierReviewFields : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "SupplierReply",
                table: "Reviews",
                type: "nvarchar(2000)",
                maxLength: 2000,
                nullable: true);

            migrationBuilder.AddColumn<System.DateTime>(
                name: "RepliedAt",
                table: "Reviews",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<bool>(
                name: "IsReported",
                table: "Reviews",
                type: "bit",
                nullable: false,
                defaultValue: false);

            migrationBuilder.AddColumn<string>(
                name: "ReportReason",
                table: "Reviews",
                type: "nvarchar(1000)",
                maxLength: 1000,
                nullable: true);

            migrationBuilder.AddColumn<System.DateTime>(
                name: "ReportedAt",
                table: "Reviews",
                type: "datetime2",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "SupplierReply",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "RepliedAt",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "IsReported",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "ReportReason",
                table: "Reviews");

            migrationBuilder.DropColumn(
                name: "ReportedAt",
                table: "Reviews");
        }
    }
}
