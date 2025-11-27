using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;
using backend_app.Services;

namespace backend_app.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class PrintController : ControllerBase
    {
        private readonly PrintService _printService;

        public PrintController(PrintService printService)
        {
            _printService = printService;
        }

        [HttpPost("complete")]
        public async Task<IActionResult> CompletePrint([FromBody] PrintCompleteRequest request)
        {
            // Shembull, në request shto userId dhe printJobName
            await _printService.NotifyPrintCompletedAsync(request.UserId, request.UserFullName, request.PrintJobName);

            return Ok(new { message = "Print marked as completed and notification sent." });
        }

        public class PrintCompleteRequest
        {
            public string UserId { get; set; }
            public string UserFullName { get; set; }
            public string PrintJobName { get; set; }
        }
    }
}