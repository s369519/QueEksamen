# Validering og Feilhåndtering - Implementert

Dette dokumentet oppsummerer implementeringen av validering og feilhåndtering i prosjektet.

## ✅ Implementert

### 1. Server-side Validering

#### DTO-validering med DataAnnotations
Alle DTOer har nå omfattende validering:

**QuizDto.cs**
- `Name`: Required, RegEx-validering, 2-40 tegn
- `Description`: Max 500 tegn
- `Category`: Max 50 tegn
- `Difficulty`: RegEx-validering (Easy|Medium|Hard)
- `TimeLimit`: Required, Range 1-100 minutter
- `Questions`: Required, minimum 1 spørsmål

**QuestionDto.cs**
- `Text`: Required, 1-500 tegn
- `Options`: Required, minimum 2 alternativer

**OptionDto.cs**
- `Text`: Required, 1-200 tegn

**LoginDto.cs**
- `Username`: Required, 3-50 tegn
- `Password`: Required, minimum 6 tegn

**RegisterDto.cs**
- `Username`: Required, 3-50 tegn
- `Email`: Required, EmailAddress-format, max 100 tegn
- `Password`: Required, minimum 6 tegn + kompleksitetskrav (uppercase, lowercase, tall, spesialtegn)

#### Automatisk ModelState-validering
`ValidateModelStateAttribute.cs` - Action filter som automatisk validerer ModelState og returnerer strukturert error-response med 400 Bad Request.

#### Duplikat-sjekk
`QuizRepository.cs` - Sjekker for duplikate quiz-navn per bruker før opprettelse:
```csharp
var existingQuiz = await _db.Quizes
    .FirstOrDefaultAsync(q => q.Name == quiz.Name && q.OwnerId == quiz.OwnerId);
    
if (existingQuiz != null)
{
    throw new InvalidOperationException($"A quiz with the name '{quiz.Name}' already exists for this user.");
}
```

### 2. Global Exception Handler

**GlobalExceptionHandler.cs** - Middleware som:
- Fanger alle uhåndterte exceptions
- Logger exceptions med ILogger
- Returnerer standardiserte error-responses
- Mapper exception-typer til HTTP-statuskoder:
  - `ArgumentNullException/ArgumentException` → 400 Bad Request
  - `UnauthorizedAccessException` → 401 Unauthorized
  - `KeyNotFoundException` → 404 Not Found
  - Andre exceptions → 500 Internal Server Error

**ErrorResponse-format:**
```json
{
    "code": 400,
    "message": "Feilmelding her",
    "errors": {
        "FieldName": ["Error message 1", "Error message 2"]
    }
}
```

### 3. Logging med Serilog

**Program.cs** - Konfigurert med:
- Serilog som logging-provider
- File logging med rotation (daglige filer, beholdes i 7 dager)
- Minimum log level: Information
- EF Core command logging redusert til Warning
- Request/response logging middleware:
  ```csharp
  app.Use(async (context, next) =>
  {
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
  ```

**Alle controllere har ILogger:**
- `QuizAPIController` - Logger operasjoner, feil, og sikkerhetshendelser
- `AuthController` - Logger pålogging, registrering, og autentiseringsfeil
- `UsersController` - Logger brukeroperasjoner

### 4. Referanse-integritet

Databasen har foreign key constraints som sikrer referanseintegritet:
- `Quizes.OwnerId` → `AspNetUsers.Id`
- `Questions.QuizId` → `Quizes.QuizId`
- `Options.QuestionId` → `Questions.QuestionId`
- `QuizAttempts.UserId` → `AspNetUsers.Id`
- `QuizAttempts.QuizId` → `Quizes.QuizId`

Program.cs inkluderer også user sync-logikk som sikrer at brukere eksisterer i begge databaser før quiz-opprettelse.

## Eksempler på bruk

### Validering av Quiz-opprettelse
```csharp
POST /api/QuizAPI/create
{
    "name": "T",  // For kort!
    "timeLimit": 150  // For høyt!
}

Response: 400 Bad Request
{
    "code": 400,
    "message": "Validation failed",
    "errors": {
        "Name": ["The name must be numbers or letters between 2 and 40 characters"],
        "TimeLimit": ["The time limit must be between 1 and 100 minutes"],
        "Questions": ["Questions are required"]
    }
}
```

### Duplikat-sjekk
```csharp
// Forsøk på å opprette quiz med samme navn
Response: 400 Bad Request
{
    "code": 400,
    "message": "A quiz with the name 'My Quiz' already exists for this user."
}
```

### Global Exception Handling
```csharp
// Uhåndtert exception i controller
Response: 500 Internal Server Error
{
    "code": 500,
    "message": "An internal server error occurred. Please try again later."
}

// I loggen:
[Error] An unhandled exception occurred: NullReferenceException at...
```

## Filer som ble opprettet/endret

### Nye filer:
- `api/Middleware/GlobalExceptionHandler.cs`
- `api/Filters/ValidateModelStateAttribute.cs`

### Endrede filer:
- `api/Program.cs` - Lagt til middleware, request logging, Serilog-config
- `api/DTOs/QuizDto.cs` - Lagt til DataAnnotations
- `api/DTOs/LoginDto.cs` - Forbedret validering
- `api/DTOs/RegisterDto.cs` - Lagt til passord-kompleksitet
- `api/DAL/QuizRepository.cs` - Lagt til duplikat-sjekk
- `api/Controllers/QuizController.cs` - Håndterer InvalidOperationException

## Testing

For å teste valideringen:
1. Prøv å opprette en quiz uten navn
2. Prøv å opprette en quiz med for langt navn
3. Prøv å opprette to quizzer med samme navn
4. Prøv å registrere bruker med svakt passord
5. Sjekk loggfiler i `api/APILogs/` for request/response logging
