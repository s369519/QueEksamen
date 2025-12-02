using Microsoft.EntityFrameworkCore;
using Que.DAL;
using Serilog;
using Serilog.Events;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using System.Text;
using Microsoft.AspNetCore.Identity;
using Que.Models;
using System.IdentityModel.Tokens.Jwt;
using Microsoft.OpenApi.Models;
using System.Security.Claims;
using Que.Middleware;
using Que.Filters;

// APPLICATION BUILDER CONFIGURATION

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog for structured logging
// Logs are written to files with daily rotation, keeping last 7 days
var loggerConfiguration = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore.Database.Command", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.File($"APILogs/app_{DateTime.Now:yyyyMMdd_HHmmss}.log",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 7);

Log.Logger = loggerConfiguration.CreateLogger();

// SERVICE CONFIGURATION

// Configure MVC controllers with global validation filter
// Newtonsoft.Json handles circular references in entity relationships
builder.Services.AddControllers(options =>
{
    // Add global model state validation filter
    options.Filters.Add<ValidateModelStateAttribute>();
}).AddNewtonsoftJson(options =>
{
    options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;
});

builder.Services.AddEndpointsApiExplorer();

// Configure Swagger/OpenAPI with JWT Bearer authentication support
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Que API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        Description = "JWT Authorization header using the Bearer scheme. Example: \"Authorization: Bearer {token} \"",
        Name = "Authorization",
        In = ParameterLocation.Header,
        Type = SecuritySchemeType.ApiKey,
        Scheme = "Bearer"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement
    {{ new OpenApiSecurityScheme
            { Reference = new OpenApiReference
                { Type = ReferenceType.SecurityScheme,
                   Id = "Bearer"}},
                Array.Empty<string>()
            }});
});


// QuizDbContext: Stores quizzes, questions, options, and quiz attempts
builder.Services.AddDbContext<QuizDbContext>(options => {
    options.UseSqlite(builder.Configuration["ConnectionStrings:QuizDbContextConnection"]);});

// AuthDbContext: Stores user authentication data (ASP.NET Identity)
builder.Services.AddDbContext<AuthDbContext>(options => {
    options.UseSqlite(builder.Configuration["ConnectionStrings:AuthDbContextConnection"]);});

// Configure ASP.NET Core Identity for user management
builder.Services.AddIdentity<AuthUser, IdentityRole>()
    .AddEntityFrameworkStores<AuthDbContext>()
    .AddDefaultTokenProviders();

// Configure Identity to return 401 instead of redirecting to login page (for API)
builder.Services.ConfigureApplicationCookie(options =>
{
    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = 401;
        return Task.CompletedTask;
    };
});

// CORS policy: Allow requests from localhost only (development)
builder.Services.AddCors(options =>
{
    options.AddPolicy("CorsPolicy", builder =>
    {
        builder.SetIsOriginAllowed(origin => 
                new Uri(origin).Host == "localhost")
            .AllowAnyMethod()
            .AllowAnyHeader()
            .AllowCredentials();
    });
});

// Register repository for dependency injection
builder.Services.AddScoped<IQuizRepository, QuizRepository>();

// AUTHENTICATION & AUTHORIZATION

builder.Services.AddAuthorization();

// Configure JWT Bearer authentication
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.SaveToken = true;
        options.RequireHttpsMetadata = false; // Allow HTTP in development
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(
                builder.Configuration["Jwt:Key"] ?? throw new InvalidOperationException("JWT key not found in configuration."))),
            NameClaimType = ClaimTypes.NameIdentifier,
            RoleClaimType = ClaimTypes.Role
        };
    });

// Configure Serilog as the logging provider
builder.Logging.ClearProviders();
builder.Logging.AddSerilog(Log.Logger);

builder.Services.AddAuthorization();

// APPLICATION MIDDLEWARE PIPELINE

var app = builder.Build();

// Global exception handler - MUST be first to catch all exceptions
app.UseMiddleware<GlobalExceptionHandler>();

// Custom request/response logging middleware
app.Use(async (context, next) =>
{
    var logger = context.RequestServices.GetRequiredService<ILogger<Program>>();
    logger.LogInformation("HTTP {Method} {Path} from {RemoteIp}", 
        context.Request.Method, 
        context.Request.Path, 
        context.Connection.RemoteIpAddress);
    
    await next();
    
    logger.LogInformation("HTTP {Method} {Path} responded {StatusCode}", 
        context.Request.Method, 
        context.Request.Path, 
        context.Response.StatusCode);
});

// Development-only features: database seeding and Swagger UI
if (app.Environment.IsDevelopment())
{
    DbInit.Seed(app);
    app.UseSwagger();
    app.UseSwaggerUI();
}

// USER SYNCHRONIZATION
// Ensures users from AuthDbContext exist in QuizDbContext for foreign key constraints
using (var scope = app.Services.CreateScope())
{
    try
    {
        var services = scope.ServiceProvider;
        var authContext = services.GetRequiredService<AuthDbContext>();
        var quizContext = services.GetRequiredService<QuizDbContext>();

    // Read all users from the Identity (Auth) database
    var authUsers = await authContext.Users.AsNoTracking().ToListAsync();
    var startupLog = services.GetRequiredService<ILoggerFactory>().CreateLogger("UserSync");
    startupLog.LogInformation("Found {Count} users in AuthDbContext", authUsers.Count);

    var inserted = 0;
    foreach (var u in authUsers)
        {
            // Check if user exists in QuizDb (AuthUser table created by QuizDb migrations)
            var exists = await quizContext.Set<AuthUser>().FindAsync(u.Id);
            if (exists == null)
            {
                // Create a shallow copy suitable for the QuizDbContext
                var copy = new AuthUser
                {
                    Id = u.Id,
                    UserName = u.UserName,
                    NormalizedUserName = u.NormalizedUserName,
                    Email = u.Email,
                    NormalizedEmail = u.NormalizedEmail,
                    EmailConfirmed = u.EmailConfirmed,
                    PasswordHash = u.PasswordHash,
                    SecurityStamp = u.SecurityStamp,
                    ConcurrencyStamp = u.ConcurrencyStamp,
                    PhoneNumber = u.PhoneNumber,
                    PhoneNumberConfirmed = u.PhoneNumberConfirmed,
                    TwoFactorEnabled = u.TwoFactorEnabled,
                    LockoutEnd = u.LockoutEnd,
                    LockoutEnabled = u.LockoutEnabled,
                    AccessFailedCount = u.AccessFailedCount
                };

                quizContext.Set<AuthUser>().Add(copy);
                inserted++;
            }
        }
        if (inserted > 0)
        {
            await quizContext.SaveChangesAsync();
            startupLog.LogInformation("Inserted {Inserted} users into QuizDbContext AuthUser table", inserted);
        }
    }
    catch (Exception ex)
    {
        var startupLogger = scope.ServiceProvider.GetRequiredService<ILoggerFactory>().CreateLogger("Startup");
        startupLogger.LogError(ex, "Failed to synchronize users between AuthDbContext and QuizDbContext");
    }
}

// MIDDLEWARE ORDER (CRITICAL)
// Order matters: Static files → Routing → CORS → Authentication → Authorization → Controllers

app.UseStaticFiles();
app.UseRouting();
app.UseCors("CorsPolicy");

// Authentication must come before Authorization
app.UseAuthentication();
app.UseAuthorization();

// Map controller endpoints
app.MapControllers();

// Start the application
await app.RunAsync();