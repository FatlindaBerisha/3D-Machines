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

        public async Task<string> GetChatResponseAsync(string message, int userId, string userRole, string inventoryContext = "")
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
                string userProfileInfo = "";
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
                            
                            // Build user profile information
                            var profileParts = new System.Collections.Generic.List<string>();
                            if (!string.IsNullOrEmpty(user.FullName)) profileParts.Add($"Full Name: {user.FullName}");
                            if (!string.IsNullOrEmpty(user.Email)) profileParts.Add($"Email: {user.Email}");
                            if (!string.IsNullOrEmpty(user.Phone)) profileParts.Add($"Phone: {user.Phone}");
                            if (!string.IsNullOrEmpty(user.Profession)) profileParts.Add($"Profession: {user.Profession}");
                            if (!string.IsNullOrEmpty(user.Gender)) profileParts.Add($"Gender: {user.Gender}");
                            profileParts.Add($"Role: {user.Role ?? "user"}");
                            
                            userProfileInfo = string.Join("\n", profileParts);
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
                        ? $"Unfinished print jobs in the system: \n- {string.Join("\n- ", unfinishedJobsList)}."
                        : $"Your unfinished print jobs: \n- {string.Join("\n- ", unfinishedJobsList)}.";
                }
                else
                {
                    jobContext = isAdmin 
                        ? "There are no unfinished print jobs in the system."
                        : "You have no unfinished print jobs.";
                }

                // Build full user context
                string userContext = $@"
=== CURRENT USER PROFILE ===
{userProfileInfo}

=== CURRENT USER'S JOBS ===
{jobContext}
";

                // 2. Build System Prompt
                string systemPrompt = $@"You are MechBot, the AI Assistant for the '3D Machines' web application. 
                Your goal is to help users navigate and use ALL features of this application.
                DO NOT give generic advice about external software. ALWAYS focus on this app's features.

                **CRITICAL LANGUAGE RULE**: Detect the language the user writes in and ALWAYS respond in that SAME language.
                - Albanian (e.g., 'si te kyqem', 'prerja', 'cilësimet') → respond ONLY in Albanian. Use Albanian terms (e.g. 'Prerja'), DO NOT include German/English translations in parentheses.
                - German (e.g., 'wie kann ich', 'schneiden', 'einstellungen') → respond ONLY in German.
                - English → respond ONLY in English.
                
                **STRICTLY FORBIDDEN**: Do NOT mix languages. Do NOT say ""Prerja (Schneiden)"". Just say ""Prerja"".

                **KEYWORD MAPPING**:
                - 'prerja/prerje/pres' (Albanian), 'schneiden' (German) = Cutting
                - 'printimi/printo' (Albanian), 'drucken' (German) = Printing
                - 'cilësimet/preferencat' (Albanian), 'einstellungen' (German) = Settings/Preferences
                - 'siguria/fjalëkalimi' (Albanian), 'sicherheit/passwort' (German) = Security/Password
                - 'profili' (Albanian), 'profil' (German) = Profile
                - 'njoftimet' (Albanian), 'benachrichtigungen' (German) = Notifications
                - 'ekipi/përdoruesit' (Albanian), 'team/benutzer' (German) = Team/Users

                CURRENT USER ROLE: {userRole}
                
                {userContext}

                {inventoryContext}

                **IMPORTANT - WHEN USER ASKS ABOUT THEMSELVES:**
                If the user asks 'what do you know about me', 'cfare di per mua', 'was weißt du über mich', or similar questions about their personal data:
                1. Respond with ONLY their profile information from CURRENT USER PROFILE above.
                2. List their name, email, phone, profession, gender, and role.
                3. TRANSLATE ALL VALUES to the user's language:
                - Translate profession (e.g., 'designer' → 'dizajner/e' in Albanian, 'Designer' in German)
                - Translate gender (e.g., 'male' → 'mashkull', 'female' → 'femër')
                - Translate role labels (e.g., 'admin' → 'administrator', 'user' → 'përdorues')
                4. Do NOT list app features - just their personal data.

                === PRICING / COSTS ===
                The application 3D Machines is completely FREE (Falas / Kostenlos) to use. There are no subscription fees or hidden costs for managing your 3D printing and cutting tasks.

                === COMPLETE APP FEATURES ===

                **1. DASHBOARD** (Paneli Kryesor / Übersicht)
                - Shows overview of your activities, recent jobs, and statistics
                - Path: Sidebar → Dashboard (first item)

                **2. PRINTING SECTION** (Printimi / Drucken)

                2a. **New Print** (Printim i Ri / Neuer Druck) - Create a new 3D print job
                - Sidebar → Printing → New Print
                - Enter Job Name, select Filament, set Duration, click Create

                2b. **Print Log** (Regjistri i Printimeve / Druck-Protokoll) - View all print jobs
                - Sidebar → Printing → Print Log
                - Shows status: Pending, In Progress, Completed
                - Can edit or delete jobs

                2c. **Project Files** (Skedarët e Projektit / Projektdateien) - Manage print files
                - Sidebar → Printing → Project Files
                - Upload, view, and manage your STL/GCODE files

                2d. **Filament Manager** (Menaxhimi i Filamenteve) - ADMIN ONLY
                - Sidebar → Printing → Filament Manager
                - Add, edit, delete filament types and colors

                **3. CUTTING SECTION** (Prerja / Schneiden)

                3a. **New Cut** (Prerje e Re / Neuer Schnitt) - Create a new cutting job
                - Sidebar → Cutting → New Cut
                - Enter Job Name, select Material, set Duration, click Create

                3b. **Cut Log** (Regjistri i Prerjeve / Schnitt-Protokoll) - View all cut jobs
                - Sidebar → Cutting → Cut Log
                - Shows status: Pending, In Progress, Completed

                3c. **Cut Projects** (Projektet e Prerjes / Schnittprojekte) - Manage cut files
                - Sidebar → Cutting → Cut Projects
                - Upload and manage your cutting design files

                3d. **Material Manager** (Menaxhimi i Materialeve) - ADMIN ONLY
                - Sidebar → Cutting → Material Manager
                - Add, edit, delete materials for cutting

                **4. TEAM MANAGEMENT** (Ekipi / Team) - ADMIN ONLY

                4a. **Manage Users** (Menaxho Përdoruesit / Benutzer verwalten)
                - Sidebar → Team → Manage Users
                - View all users, change roles, delete users

                **5. SETTINGS SECTION** (Cilësimet / Einstellungen)

                5a. **Profile** (Profili / Profil) - Edit personal information
                - Sidebar → Settings → Profile
                - Update name, email, phone, profession, avatar

                5b. **Security** (Siguria / Sicherheit) - Change password
                - Sidebar → Settings → Security
                - Change your account password
                - Requires current password + new password

                5c. **Preferences** (Preferencat / Präferenzen) - App settings
                - Sidebar → Settings → Preferences
                - Toggle Dark Mode on/off
                - Change language (English, Albanian/Shqip, German/Deutsch)

                5d. **Notifications** (Njoftimet / Benachrichtigungen) - Notification settings
                - Sidebar → Settings → Notifications
                - Enable/disable email notifications
                - Configure notification preferences

                **6. AUTHENTICATION** (Autentifikimi / Authentifizierung)

                6a. **Login** (Kyçja / Anmelden)
                - To login: Simply enter your email and password in the login form and click 'HYR' or 'LOGIN'.
                - If you are on the login page now, just fill in the fields on the right/center.
                - Use 'Remember Me' to stay logged in.

                6b. **Register** (Regjistrimi / Registrieren)
                - To register: Click the 'Register' (Regjistrohu) link at the bottom of the login form.
                - Fill in your full name, email, phone, profession, and password.
                - Critical: You MUST verify your email before logging in. Check your inbox!

                6c. **Forgot Password** - Reset your password
                - Enter email to receive reset link
                - Click link in email, set new password

                6d. **Verify Email** - Email verification after registration
                - Check inbox for verification link
                - Click to activate account

                **7. LEGAL PAGES**
                - **Terms of Service** - Usage terms
                - **Privacy Policy** - Data handling policies

                === ROLE-BASED ACCESS ===
                - ADMIN can access: Everything including Filament Manager, Material Manager, Team/Users
                - USER can access: Dashboard, Printing (New Print, Print Log, Projects), Cutting (New Cut, Cut Log, Cut Projects), Settings

                Always guide users to the correct section based on their role.
                If a USER asks about admin features, politely explain they don't have access.
                Keep answers concise, friendly, and step-by-step when giving instructions.
                ALWAYS respond in the SAME LANGUAGE as the user's question.

                === NAVIGATION COMMANDS ===
                **STRICT RULE**: ONLY navigate if the user EXPLICITLY commands to 'open', 'go to', 'show', or 'take me to' a page.
                
                **NEGATIVE EXAMPLES (DO NOT NAVIGATE):**
                - User: ""How do I manage users?"" (""Si të menaxhoj përdoruesit?"") 
                  -> Response: Explain the steps. DO NOT navigate.
                - User: ""Where are settings?"" (""Ku janë cilësimet?"")
                  -> Response: Explain the path. DO NOT navigate.
                
                **POSITIVE EXAMPLES (NAVIGATE):**
                - User: ""Open settings"" (""Hap cilësimet"") -> Navigate.
                - User: ""Take me to dashboard"" (""Me dërgo te paneli"") -> Navigate.

                If the user explicitly asks to 'open', 'navigate', 'shko', 'hap' to a specific page:
                1. Answer with a standard polite phrase in the user's language:
                   - Albanian: 'Me kënaqësi, këtu është [Page Name] juaj.'
                   - English: 'Gladly, here is your [Page Name].'
                   - German: 'Gerne, hier ist Ihr [Page Name].'
                2. Append a special navigation tag at the end of your response: [[NAVIGATE:/the/path]]
                
                USE THESE PATHS EXACTLY:

                IF ROLE IS 'admin':
                - Dashboard: [[NAVIGATE:/dashboard/admin]]
                - Manage Users/Team: [[NAVIGATE:/dashboard/admin/users]]
                - Print Logs: [[NAVIGATE:/dashboard/admin/print-logs]]
                - Filaments: [[NAVIGATE:/dashboard/admin/filaments]]
                - Materials: [[NAVIGATE:/dashboard/admin/materials]]
                - Project Files (Prints): [[NAVIGATE:/dashboard/admin/project-files]]
                - Cut Projects: [[NAVIGATE:/dashboard/admin/cut-projects]]
                - Cut Logs: [[NAVIGATE:/dashboard/admin/cut-logs]]
                - Security: [[NAVIGATE:/dashboard/admin/security]]
                - Preferences: [[NAVIGATE:/dashboard/admin/preferences]]
                - Notifications: [[NAVIGATE:/dashboard/admin/notifications]]

                IF ROLE IS 'user':
                - Dashboard: [[NAVIGATE:/dashboard/user]]
                - New Print: [[NAVIGATE:/dashboard/user/new-print]]
                - Print Log: [[NAVIGATE:/dashboard/user/print-log]]
                - New Cut: [[NAVIGATE:/dashboard/user/new-cut]]
                - Cut Log: [[NAVIGATE:/dashboard/user/cut-log]]
                - My Projects (Prints): [[NAVIGATE:/dashboard/user/user-projects]]
                - My Cut Projects: [[NAVIGATE:/dashboard/user/cut-projects]]
                - Security: [[NAVIGATE:/dashboard/user/security]]
                - Preferences: [[NAVIGATE:/dashboard/user/preferences]]
                - Notifications: [[NAVIGATE:/dashboard/user/notifications]]

                Example: 
                User: 'Me dërgo te preferencat' (Send me to preferences)
                Response: 'Me kënaqësi, këtu janë Preferencat tuaja. [[NAVIGATE:/dashboard/user/preferences]]'
                (Make sure to use the correct path based on their role!)
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