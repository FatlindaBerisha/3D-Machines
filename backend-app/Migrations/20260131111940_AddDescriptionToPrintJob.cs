using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend_app.Migrations
{
    /// <inheritdoc />
    public partial class AddDescriptionToPrintJob : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "PrintJobs",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Description",
                table: "PrintJobs");
        }
    }
}
