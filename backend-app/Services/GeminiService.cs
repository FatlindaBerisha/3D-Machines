using Google.GenAI;
using Google.GenAI.Types;
using Microsoft.Extensions.Configuration;
using System.Threading.Tasks;
using System.Linq;


namespace backend_app.Services
{
    public class GeminiService
    {
        private readonly string _apiKey;
        private readonly Google.GenAI.Client _client;
        private readonly backend_app.Data.AppDbContext _context;

        public GeminiService(IConfiguration configuration, backend_app.Data.AppDbContext context)
        {
            _apiKey = configuration["Gemini:ApiKey"];
            _context = context;
            if (string.IsNullOrEmpty(_apiKey))
            {
                throw new System.Exception("Gemini API Key is missing in configuration.");
            }
            // The SDK expects the key in the environment variable GOOGLE_API_KEY
            System.Environment.SetEnvironmentVariable("GOOGLE_API_KEY", _apiKey);
            _client = new Google.GenAI.Client();
        }

        public async Task<string> GetChatResponseAsync(string message, int userId, string userRole)
        {
            try 
            {
                if (string.IsNullOrEmpty(_apiKey))
                {
                    System.Console.WriteLine("CRITICAL ERROR: Gemini API Key is missing or empty.");
                    return "Error: Gemini API Key is missing on server.";
                }

                System.Console.WriteLine($"Sending request to Gemini model 'gemini-2.5-flash-lite' for role '{userRole}'");

                // 1. Fetch User Info and unfinished Print Jobs
                string userDisplayName = "User";
                var unfinishedJobsList = new System.Collections.Generic.List<string>();
                bool isAdmin = userRole.ToLower() == "admin";
                
                try
                {
                    if (userId > 0)
                    {
                        var user = await Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.FirstOrDefaultAsync(_context.Users, u => u.Id == userId);
                        if (user != null)
                        {
                            userDisplayName = user.FullName ?? user.Email ?? "User";
                        }



                        var jobsQuery = Microsoft.EntityFrameworkCore.EntityFrameworkQueryableExtensions.Include(_context.PrintJobs, j => j.User)
                                                        .Where(j => j.Status != "Completed");

                        if (!isAdmin)
                        {
                            jobsQuery = jobsQuery.Where(j => j.UserId == userId);
                        }
                        
                        var jobs = jobsQuery.ToList();
                        foreach (var j in jobs)
                        {
                            string ownerName = j.User?.FullName ?? j.User?.Email ?? "Unknown User";
                            string formattedJob = isAdmin 
                                ? $"{ownerName} - {j.JobName} (Status: {j.Status})"
                                : $"{j.JobName} (Status: {j.Status})";
                            
                            unfinishedJobsList.Add(formattedJob);
                        }
                    }
                }
                catch (System.Exception dbEx)
                {
                    System.Console.WriteLine($"Error fetching user/jobs data: {dbEx.Message}");
                }

                string jobContext = "";
                if (unfinishedJobsList.Any())
                {
                    jobContext = isAdmin 
                        ? $"Here are the unfinished print jobs across the entire system: \n- {string.Join("\n- ", unfinishedJobsList)}."
                        : $"You currently have these unfinished print jobs: \n- {string.Join("\n- ", unfinishedJobsList)}.";
                }
                else
                {
                    jobContext = isAdmin 
                        ? "There are no unfinished print jobs in the system at the moment."
                        : "You have no unfinished print jobs at the moment.";
                }

                // 2. Build System Prompt
                string systemPrompt = $@"You are the AI Assistant for the '3D Machines' web application. 
Your goal is to help users manage their 3D printing workflow within THIS application. 
DO NOT give generic advice about Windows/Mac/Android printing unless explicitly asked for outside context.
ALWAYS focus on the features available in the '3D Machines' sidebar and dashboard.

CURRENT USER ROLE: {userRole}
CURRENT USER CONTEXT:
{jobContext}

When the user asks about their unfinished work, jobs, or status:
1.  **Directly list the jobs** exactly as provided in the 'CURRENT USER CONTEXT'. 
2.  Do not change the format of the job strings provided in the context.
3.  If the context says they have no unfinished jobs, tell them plainly.

Here are the specific workflows for this app:

1. **How to create a New Print Job**:
   - Go to the **Sidebar**.
   - Click on **Printing**.
   - Select **New Print**.
   - Fill in the form: Enter 'Job Name', select a 'Filament' from the dropdown, and enter 'Duration'.
   - Click the **Create Print Job** button.

2. **How to Check Print Logs**:
   - Go to Sidebar -> Printing -> **Print Log**.
   - Here you can see a table of all your print jobs with status (Pending, In Progress, Completed).

3. **How to Manage Filaments (ADMIN ONLY)**:
   - Go to Sidebar -> Printing -> **Filament Manager**.
   - **Note**: This page is only accessible to users with the 'Admin' role. Regular users cannot manage filaments.
   - If a USER (non-admin) asks how to manage filaments, you MUST tell them: **'You do not have access to manage filaments as this is an administrator-only feature.'**
   - Here admins can Add, Edit, or Delete filaments used for printing.

4. **Dashboard**:
   - The Dashboard shows an overview of your activities.

5. **Profile**:
   - You can update your profile details in sidebar -> **Profile**.

If the user asks 'How do I print?', assume they mean 'How do I create a print job in this app?' and guide them to the 'New Print' page.
If the user asks 'What are my unfinished jobs?', use the CURRENT USER CONTEXT to answer.
If a non-admin user asks about filament management, politely inform them they lack the required permissions.
Keep your answers concise, friendly, and helpful.
";

                string fullPrompt = systemPrompt + "\n\nUser Question: " + message;
                
                var response = await _client.Models.GenerateContentAsync(
                    model: "gemini-2.5-flash-lite",
                    contents: fullPrompt
                );

                if (response?.Candidates == null || response.Candidates.Count == 0)
                {
                    System.Console.WriteLine("WARNING: Received empty response candidates from Gemini.");
                    return "No response from AI.";
                }

                var part = response.Candidates[0]?.Content?.Parts?[0];
                var text = part?.Text ?? "Empty response.";
                System.Console.WriteLine("Successfully received response from Gemini.");
                return text;
            }
            catch (System.Exception ex)
            {
                System.Console.WriteLine($"EXCEPTION in GeminiService: {ex.Message}");
                System.Console.WriteLine($"Stack Trace: {ex.StackTrace}");
                throw; // Rethrow so controller catches/logs it too or returns 500
            }
        }
    }
}