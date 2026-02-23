using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend_app.Migrations
{
    /// <inheritdoc />
    public partial class AddPrintJobAdvancedFeatures : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<DateTime>(
                name: "EndTime",
                table: "PrintJobs",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "StartTime",
                table: "PrintJobs",
                type: "datetime2",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "PrintJobComments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PrintJobId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Text = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PrintJobComments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PrintJobComments_PrintJobs_PrintJobId",
                        column: x => x.PrintJobId,
                        principalTable: "PrintJobs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PrintJobComments_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "PrintJobParticipants",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    PrintJobId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PrintJobParticipants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PrintJobParticipants_PrintJobs_PrintJobId",
                        column: x => x.PrintJobId,
                        principalTable: "PrintJobs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_PrintJobParticipants_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PrintJobComments_PrintJobId",
                table: "PrintJobComments",
                column: "PrintJobId");

            migrationBuilder.CreateIndex(
                name: "IX_PrintJobComments_UserId",
                table: "PrintJobComments",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_PrintJobParticipants_PrintJobId",
                table: "PrintJobParticipants",
                column: "PrintJobId");

            migrationBuilder.CreateIndex(
                name: "IX_PrintJobParticipants_UserId",
                table: "PrintJobParticipants",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PrintJobComments");

            migrationBuilder.DropTable(
                name: "PrintJobParticipants");

            migrationBuilder.DropColumn(
                name: "EndTime",
                table: "PrintJobs");

            migrationBuilder.DropColumn(
                name: "StartTime",
                table: "PrintJobs");
        }
    }
}
