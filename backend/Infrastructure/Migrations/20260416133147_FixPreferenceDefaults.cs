using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class FixPreferenceDefaults : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // Fix existing rows that have empty string defaults from the AddUserProfileFields migration.
            // Any user whose LanguagePreference or CurrencyPreference is blank gets the correct default.
            migrationBuilder.Sql(
                "UPDATE [AspNetUsers] SET [LanguagePreference] = 'en'  WHERE [LanguagePreference] = '' OR [LanguagePreference] IS NULL");
            migrationBuilder.Sql(
                "UPDATE [AspNetUsers] SET [CurrencyPreference] = 'USD' WHERE [CurrencyPreference] = '' OR [CurrencyPreference] IS NULL");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // No rollback needed — reverting to empty strings would break validation.
        }
    }
}
