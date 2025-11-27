using backend_app.Hubs;
using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace backend_app.Services
{
    public class PrintService
    {
        private readonly IHubContext<NotificationHub> _hubContext;

        public PrintService(IHubContext<NotificationHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public async Task NotifyPrintCompletedAsync(string userId, string userName, string jobName)
        {
            await _hubContext.Clients.User(userId)
                .SendAsync("ReceiveMessage", userName, $"Your print job '{jobName}' is completed.");
        }
    }
}