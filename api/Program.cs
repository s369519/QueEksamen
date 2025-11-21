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

var builder = WebApplication.CreateBuilder(args);

// Configure Serilog early for startup logging
var loggerConfiguration = new LoggerConfiguration()
    .MinimumLevel.Information()
    .MinimumLevel.Override("Microsoft.EntityFrameworkCore.Database.Command", LogEventLevel.Warning)
    .Enrich.FromLogContext()
    .WriteTo.File($"APILogs/app_{DateTime.Now:yyyyMMdd_HHmmss}.log",
        rollingInterval: RollingInterval.Day,
        retainedFileCountLimit: 7);

Log.Logger = loggerConfiguration.CreateLogger();

builder.Services.AddControllers(options =>
{
    // Add global model state validation filter
    options.Filters.Add<ValidateModelStateAttribute>();
}).AddNewtonsoftJson(options =>
{
    options.SerializerSettings.ReferenceLoopHandling = Newtonsoft.Json.ReferenceLoopHandling.Ignore;
});

builder.Services.AddEndpointsApiExplorer();

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
                new string[]{}
            }});
});

builder.Services.AddDbContext<QuizDbContext>(options => {
    options.UseSqlite(builder.Configuration["ConnectionStrings:QuizDbContextConnection"]);});

builder.Services.AddDbContext<AuthDbContext>(options => {
    options.UseSqlite(builder.Configuration["ConnectionStrings:AuthDbContextConnection"]);});

builder.Services.AddIdentity<AuthUser, IdentityRole>()
    .AddEntityFrameworkStores<AuthDbContext>()
    .AddDefaultTokenProviders();

builder.Services.ConfigureApplicationCookie(options =>
{
    options.Events.OnRedirectToLogin = context =>
    {
        context.Response.StatusCode = 401;
        return Task.CompletedTask;
    };
});

// fjernet for L15 : builder.Services.AddControllers();

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

builder.Services.AddScoped<IQuizRepository, QuizRepository>();

builder.Services.AddAuthorization();
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.SaveToken = true;
        options.RequireHttpsMetadata = false;
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

        // For debugging senere:
        /*
        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var token = context.Request.Headers["Authorization"].FirstOrDefault()?.Split(" ").LastOrDefault();
                Console.WriteLine($"OnMessageReceived - Token: {token}");
                return Task.CompletedTask;
            },
            OnTokenValidated = context =>
            {
                Console.WriteLine("OnTokenValidated: SUCCESS");
                return Task.CompletedTask;
            },
            OnAuthenticationFailed = context =>
            {
                Console.WriteLine($"OnAuthenticationFailed: {context.Exception.Message}");
                if (context.Exception.InnerException != null)
                {
                    Console.WriteLine($"Inner Exception: {context.Exception.InnerException.Message}");
                }
                return Task.CompletedTask;
            },
            OnChallenge = context =>
            {
                Console.WriteLine($"OnChallenge: {context.Error} - {context.ErrorDescription}");
                return Task.CompletedTask;
            }
        };
        */
    });

// Remove duplicate logger configuration and use the one created above
builder.Logging.ClearProviders();
builder.Logging.AddSerilog(Log.Logger);

builder.Services.AddAuthorization();

var app = builder.Build();

// Add global exception handler middleware (must be first)
app.UseMiddleware<GlobalExceptionHandler>();

// Request logging middleware
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

if (app.Environment.IsDevelopment())
{
    DBInit.Seed(app);
    app.UseSwagger();
    app.UseSwaggerUI();
}
// Ensure users in AuthDbContext are present in QuizDbContext to satisfy FK constraints
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
app.UseStaticFiles();
app.UseRouting();
app.UseCors("CorsPolicy");

/* app.Use(async (context, next) =>
{
    if (context.Request.Headers.TryGetValue("Authorization", out var authHeader))
    {
        var headerValue = authHeader.FirstOrDefault();
        if (headerValue?.StartsWith("Bearer ") == true)
        {
            var token = headerValue.Substring("Bearer ".Length).Trim();

            var handler = new JwtSecurityTokenHandler();
            var jsonToken = handler.ReadJwtToken(token);

            console.WriteLine($"--> Token Issuer: {jsonToken.Issuer}");
            console.WriteLine($"--> Token Audience: {jsonToken.Audiences.FirstOrDefault()}");
            console.WriteLine($"--> Token Expiry: {jsonToken.ValidTo}");
            console.WriteLine($"--> Current Time: {DateTime.UtcNow}");
            console.WriteLine($"--> Config Issuer: {builder.Configuration["Jwt:Issuer"]}");
            console.WriteLine($"--> Config Audience: {builder.Configuration["Jwt:Audience"]}");
        }
    }
    await next.Invoke();
});
*/

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

await app.RunAsync();