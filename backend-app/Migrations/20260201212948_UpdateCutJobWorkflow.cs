using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend_app.Migrations
{
    /// <inheritdoc />
    public partial class UpdateCutJobWorkflow : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "PrintPhase",
                table: "PrintJobs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "CutPhase",
                table: "CutJobs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Description",
                table: "CutJobs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "EndTime",
                table: "CutJobs",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "LastResumedAt",
                table: "CutJobs",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Machine",
                table: "CutJobs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Power",
                table: "CutJobs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "Speed",
                table: "CutJobs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.AddColumn<DateTime>(
                name: "StartTime",
                table: "CutJobs",
                type: "datetime2",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "TimeEstimate",
                table: "CutJobs",
                type: "nvarchar(max)",
                nullable: true);

            migrationBuilder.CreateTable(
                name: "CutJobComments",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CutJobId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    Text = table.Column<string>(type: "nvarchar(max)", nullable: false),
                    Tag = table.Column<string>(type: "nvarchar(max)", nullable: true),
                    CreatedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CutJobComments", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CutJobComments_CutJobs_CutJobId",
                        column: x => x.CutJobId,
                        principalTable: "CutJobs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CutJobComments_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateTable(
                name: "CutJobParticipants",
                columns: table => new
                {
                    Id = table.Column<int>(type: "int", nullable: false)
                        .Annotation("SqlServer:Identity", "1, 1"),
                    CutJobId = table.Column<int>(type: "int", nullable: false),
                    UserId = table.Column<int>(type: "int", nullable: false),
                    JoinedAt = table.Column<DateTime>(type: "datetime2", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_CutJobParticipants", x => x.Id);
                    table.ForeignKey(
                        name: "FK_CutJobParticipants_CutJobs_CutJobId",
                        column: x => x.CutJobId,
                        principalTable: "CutJobs",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                    table.ForeignKey(
                        name: "FK_CutJobParticipants_Users_UserId",
                        column: x => x.UserId,
                        principalTable: "Users",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Restrict);
                });

            migrationBuilder.CreateIndex(
                name: "IX_CutJobComments_CutJobId",
                table: "CutJobComments",
                column: "CutJobId");

            migrationBuilder.CreateIndex(
                name: "IX_CutJobComments_UserId",
                table: "CutJobComments",
                column: "UserId");

            migrationBuilder.CreateIndex(
                name: "IX_CutJobParticipants_CutJobId",
                table: "CutJobParticipants",
                column: "CutJobId");

            migrationBuilder.CreateIndex(
                name: "IX_CutJobParticipants_UserId",
                table: "CutJobParticipants",
                column: "UserId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "CutJobComments");

            migrationBuilder.DropTable(
                name: "CutJobParticipants");

            migrationBuilder.DropColumn(
                name: "PrintPhase",
                table: "PrintJobs");

            migrationBuilder.DropColumn(
                name: "CutPhase",
                table: "CutJobs");

            migrationBuilder.DropColumn(
                name: "Description",
                table: "CutJobs");

            migrationBuilder.DropColumn(
                name: "EndTime",
                table: "CutJobs");

            migrationBuilder.DropColumn(
                name: "LastResumedAt",
                table: "CutJobs");

            migrationBuilder.DropColumn(
                name: "Machine",
                table: "CutJobs");

            migrationBuilder.DropColumn(
                name: "Power",
                table: "CutJobs");

            migrationBuilder.DropColumn(
                name: "Speed",
                table: "CutJobs");

            migrationBuilder.DropColumn(
                name: "StartTime",
                table: "CutJobs");

            migrationBuilder.DropColumn(
                name: "TimeEstimate",
                table: "CutJobs");
        }
    }
}
