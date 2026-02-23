using Microsoft.AspNetCore.SignalR;
using System.Collections.Concurrent;
using System.Security.Claims;
using System.Threading.Tasks;
using System.IdentityModel.Tokens.Jwt;

namespace backend_app.Hubs
{
    public class NotificationHub : Hub
    {
        // Tracks multiple connections per User ID: UserID -> { ConnectionID -> byte }
        private static ConcurrentDictionary<string, ConcurrentDictionary<string, byte>> userConnections = new();

        public override async Task OnConnectedAsync()
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                         ?? Context.User?.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

            var role = Context.User?.FindFirst(ClaimTypes.Role)?.Value;

            if (!string.IsNullOrEmpty(userId))
            {
                var connections = userConnections.GetOrAdd(userId, _ => new ConcurrentDictionary<string, byte>());
                connections.TryAdd(Context.ConnectionId, 0);

                System.Console.WriteLine($"[Hub Info] User {userId} connected on {Context.ConnectionId}. Total tabs: {connections.Count}");

                if (role?.ToLower() == "admin")
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, "admins");
                }
            }
            else
            {
                System.Console.WriteLine($"[Hub Warning] Anonymous connection on {Context.ConnectionId}");
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(System.Exception? exception)
        {
            var userId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                         ?? Context.User?.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

            if (!string.IsNullOrEmpty(userId))
            {
                if (userConnections.TryGetValue(userId, out var connections))
                {
                    connections.TryRemove(Context.ConnectionId, out _);
                    System.Console.WriteLine($"[Hub Info] User {userId} tab disconnected. Remaining tabs: {connections.Count}");
                    
                    if (connections.IsEmpty)
                    {
                        userConnections.TryRemove(userId, out _);
                    }
                }
            }

            await base.OnDisconnectedAsync(exception);
        }

        [HubMethodName("sendMessage")]
        public async Task SendMessage(string user, string message)
        {
            try
            {
                await Clients.All.SendAsync("ReceiveMessage", user, message);
            }
            catch (System.Exception ex)
            {
                System.Console.WriteLine($"[Hub Error] SendMessage: {ex.Message}");
                throw;
            }
        }

        [HubMethodName("sendCallInvitation")]
        public async Task SendCallInvitation(string targetUserId, string offer, string jobId, string jobType, string senderName, string jobName)
        {
            try
            {
                var senderUserId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                                 ?? Context.User?.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;
                
                System.Console.WriteLine($"[Hub Info] SendCallInvitation from {senderName} ({senderUserId}) to {targetUserId} for {jobType} {jobName} ({jobId})");

                if (!string.IsNullOrEmpty(targetUserId))
                {
                    // Primary: Standard SignalR User targeting
                    // senderName is used as jobName fallback or additional info
                    await Clients.User(targetUserId).SendAsync("ReceiveCallInvitation", senderUserId, offer, jobId, jobType, senderName, jobName);
                }
            }
            catch (System.Exception ex)
            {
                System.Console.WriteLine($"[Hub Error] SendCallInvitation: {ex.Message}\n{ex.StackTrace}");
                throw;
            }
        }

        [HubMethodName("sendHangup")]
        public async Task SendHangup(string targetUserId)
        {
            try
            {
                var senderUserId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                                 ?? Context.User?.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

                System.Console.WriteLine($"[Hub Info] SendHangup from {senderUserId} to {targetUserId}");

                if (!string.IsNullOrEmpty(targetUserId))
                {
                    await Clients.User(targetUserId).SendAsync("ReceiveHangup", senderUserId);
                }
            }
            catch (System.Exception ex)
            {
                System.Console.WriteLine($"[Hub Error] SendHangup: {ex.Message}\n{ex.StackTrace}");
                throw;
            }
        }

        [HubMethodName("sendSignal")]
        public async Task SendSignal(string targetUserId, string signal)
        {
            try
            {
                var senderUserId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                                 ?? Context.User?.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

                if (!string.IsNullOrEmpty(targetUserId))
                {
                    await Clients.User(targetUserId).SendAsync("ReceiveSignal", senderUserId, signal);
                }
            }
            catch (System.Exception ex)
            {
                System.Console.WriteLine($"[Hub Error] SendSignal: {ex.Message}\n{ex.StackTrace}");
                throw;
            }
        }

        [HubMethodName("sendCallResponse")]
        public async Task SendCallResponse(string targetUserId, string answer)
        {
            try
            {
                var senderUserId = Context.User?.FindFirst(ClaimTypes.NameIdentifier)?.Value
                                 ?? Context.User?.FindFirst(JwtRegisteredClaimNames.Sub)?.Value;

                if (!string.IsNullOrEmpty(targetUserId))
                {
                    await Clients.User(targetUserId).SendAsync("ReceiveCallResponse", senderUserId, answer);
                }
            }
            catch (System.Exception ex)
            {
                System.Console.WriteLine($"[Hub Error] SendCallResponse: {ex.Message}\n{ex.StackTrace}");
                throw;
            }
        }
    }
}