using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend_app.Migrations
{
    /// <inheritdoc />
    public partial class UpgradePrintJobWorkflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "Infill",
                table: "PrintJobs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "LayerHeight",
                table: "PrintJobs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Nozzle",
                table: "PrintJobs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Printer",
                table: "PrintJobs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TimeEstimate",
                table: "PrintJobs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Tag",
                table: "PrintJobComments",
                type: "nvarchar(max)",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Infill",
                table: "PrintJobs");

            migrationBuilder.DropColumn(
                name: "LayerHeight",
                table: "PrintJobs");

            migrationBuilder.DropColumn(
                name: "Nozzle",
                table: "PrintJobs");

            migrationBuilder.DropColumn(
                name: "Printer",
                table: "PrintJobs");

            migrationBuilder.DropColumn(
                name: "TimeEstimate",
                table: "PrintJobs");

            migrationBuilder.DropColumn(
                name: "Tag",
                table: "PrintJobComments");
        }
    }
}
