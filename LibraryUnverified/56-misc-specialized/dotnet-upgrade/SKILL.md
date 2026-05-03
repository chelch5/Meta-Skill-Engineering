---
name: dotnet-upgrade
description: 'Execute .NET Framework to .NET 8+ upgrades for class libraries, APIs, and Azure Functions. Use when modernizing legacy .NET projects, migrating from packages.config to PackageReference, or updating CI/CD pipelines for .NET 8+ compatibility.'
---

# Purpose

Modernize legacy .NET solutions to current LTS versions (.NET 8+) by systematically analyzing project dependencies, updating target frameworks, modernizing code patterns, and validating build and deployment pipelines.

# When to use

- Upgrading solutions from .NET Framework 4.x to .NET 8+
- Migrating projects from .NET Core 3.1 or .NET 5/6/7 to .NET 8+
- Converting packages.config-based projects to PackageReference format
- Modernizing legacy ASP.NET applications to minimal API patterns
- Updating Azure Functions from in-process to isolated worker model
- Refactoring CI/CD pipelines for SDK version pinning and .NET 8+ compatibility
- Analyzing breaking changes and deprecated API usage before migration

# When NOT to use

- For greenfield .NET projects already targeting .NET 8+ with no legacy dependencies
- When only updating NuGet packages without framework version changes
- For simple dependency updates where `dotnet list package --outdated` is sufficient
- For non-.NET projects (Java, Node.js, Python, etc.)
- When the solution has no buildable projects or is missing core infrastructure files

# Procedure

## 1. Discovery and Assessment

Identify the current state of all projects in the solution:

1. List all project files (`*.csproj`, `*.vbproj`) in the solution directory
2. For each project, read the file and extract:
   - Current `TargetFramework` value (e.g., `net472`, `netcoreapp3.1`, `net6.0`)
   - SDK-style vs legacy project format (look for `<Project Sdk="Microsoft.NET.Sdk">`)
   - Package management format (look for `packages.config` vs `<PackageReference>`)
   - Project type (class library, console app, web app, Azure Functions)
3. Identify the upgrade path for each project:
   - .NET Framework 4.6.1-4.8 → .NET 8.0
   - .NET Core 3.1 → .NET 8.0
   - .NET 5/6/7 → .NET 8.0
4. Note any projects using deprecated patterns:
   - `WebHostBuilder` → should migrate to `HostBuilder`
   - `Startup.cs` + `Program.cs` → should consolidate to minimal hosting
   - Azure Functions v3/v4 in-process → should migrate to isolated worker model

## 2. Dependency Analysis

Analyze external and internal dependencies for compatibility:

1. For SDK-style projects, run: `dotnet list package --outdated --format json`
2. For legacy projects with `packages.config`, note that PackageReference migration is required first
3. Check each NuGet package for .NET 8+ compatibility:
   - Search nuget.org or package documentation for target framework support
   - Identify packages with no .NET 8+ support and find alternatives
4. Map internal project dependencies using the solution file or `ProjectReference` elements
5. Determine upgrade order: start with leaf dependencies (libraries with no internal dependencies), work up to entry points (APIs, Functions, executables)

## 3. Packages.config Migration (if applicable)

For projects still using `packages.config`:

1. In Visual Studio or using the migration tool, convert to PackageReference:
   - Visual Studio: Right-click References → Migrate packages.config to PackageReference
   - Or use the .NET Upgrade Assistant: `upgrade-assistant migrate-packages.config <project>`
2. Verify the migration:
   - Confirm `packages.config` is removed
   - Confirm `<PackageReference>` elements appear in `.csproj`
   - Build the project to validate: `dotnet build <project>`
3. If build fails, check for:
   - Missing binding redirects in `app.config`/`web.config`
   - Content files that need manual migration
   - MSBuild imports that referenced `packages` folder paths

## 4. Target Framework Update

Update each project to .NET 8.0:

1. Edit the `.csproj` file and update or add the `TargetFramework` element:
   ```xml
   <TargetFramework>net8.0</TargetFramework>
   ```
2. For multi-targeting scenarios, use:
   ```xml
   <TargetFrameworks>net8.0;netstandard2.0</TargetFrameworks>
   ```
3. Update related SDK references if needed:
   - ASP.NET Core: Ensure `Microsoft.NET.Sdk.Web` is used
   - Azure Functions: Update to `Microsoft.NET.Sdk.Functions` with isolated worker
4. Build the project and note any compilation errors: `dotnet build <project> --verbosity normal`

## 5. Code Modernization

Fix compilation errors and modernize code patterns:

1. Address breaking changes identified during build:
   - Update deprecated API calls to their replacements
   - Add missing package references for APIs moved to separate packages
   - Update namespace imports (e.g., `Microsoft.AspNetCore.*` changes)
2. Modernize hosting patterns:
   - Convert `WebHostBuilder` usage to `HostBuilder` or minimal hosting
   - Consolidate `Startup.cs` ConfigureServices/Configure into `Program.cs`
   - Example minimal API pattern:
     ```csharp
     var builder = WebApplication.CreateBuilder(args);
     // Add services
     var app = builder.Build();
     // Configure middleware
     app.Run();
     ```
3. Update Azure Functions patterns:
   - Migrate from in-process to isolated worker model
   - Update function signatures to use new binding types
   - Update `local.settings.json` and host configuration
4. Review and update DI registration patterns
5. Convert synchronous I/O calls to async where applicable

## 6. Package Updates

Update NuGet packages to .NET 8+ compatible versions:

1. Run `dotnet list package --outdated` to identify outdated packages
2. For each outdated package:
   - Check if a .NET 8+ compatible version exists on nuget.org
   - Update using `dotnet add package <name> --version <version>`
   - Or edit `.csproj` directly
3. Handle incompatible packages:
   - Search for alternative packages with .NET 8+ support
   - Consider polyfill packages for missing APIs
   - For internal packages, plan updates to those projects first
4. Resolve transitive dependency conflicts:
   - Use `dotnet list package --deprecated --outdated --vulnerable`
   - Explicitly reference required versions in `.csproj` if needed
   - Run `dotnet restore --verbosity detailed` to diagnose conflicts

## 7. CI/CD Pipeline Updates

Update build and deployment configurations:

1. For Azure DevOps (YAML pipelines):
   - Update `UseDotNet@2` task to install .NET 8 SDK:
     ```yaml
     - task: UseDotNet@2
       inputs:
         version: '8.x'
         packageType: 'sdk'
     ```
   - Update `NuGetToolInstaller` if using specific NuGet versions
   - Update `dotnet` CLI commands to use appropriate TFMs
2. For GitHub Actions:
   - Update `actions/setup-dotnet` to v3+ with .NET 8:
     ```yaml
     - uses: actions/setup-dotnet@v3
       with:
         dotnet-version: '8.x'
     ```
3. Update container/Dockerfile base images:
   - Change `FROM mcr.microsoft.com/dotnet/sdk:6.0` to `:8.0`
   - Change `FROM mcr.microsoft.com/dotnet/aspnet:6.0` to `:8.0`
4. Update any build scripts that reference SDK versions

## 8. Testing and Validation

Validate the upgraded solution:

1. Build the entire solution: `dotnet build`
2. Run all tests: `dotnet test --verbosity normal`
3. For test failures:
   - Identify if failure is due to test code or application code
   - Update test dependencies (xUnit, NUnit, MSTest) to .NET 8+ compatible versions
   - Update test configuration (testhost, runtimeconfig)
4. Verify runtime behavior:
   - Run the application locally: `dotnet run`
   - Check logging output
   - Verify configuration loads correctly
   - Test critical API endpoints or functions
5. For Azure Functions:
   - Run locally using Azure Functions Core Tools: `func start`
   - Verify function triggers execute correctly

## 9. Breaking Change Remediation

Address identified breaking changes:

1. Review build warnings for obsolete/deprecated API usage
2. Check for runtime behavior changes:
   - JSON serialization changes (System.Text.Json defaults)
   - Entity Framework Core query behavior changes
   - Authentication/authorization middleware changes
3. Update configuration:
   - `appsettings.json` structure changes
   - Environment variable naming conventions
   - Connection string formats
4. Document any intentional behavioral changes for stakeholders

## 10. Version Control and Documentation

Commit changes with clear tracking:

1. Stage all modified files: `git add .`
2. Create structured commits:
   - One commit per project for large solutions, OR
   - Logical groupings (all libraries, then all apps)
3. Write descriptive commit messages:
   ```
   Upgrade ClassLibrary1 to .NET 8

   - Updated TargetFramework to net8.0
   - Migrated from packages.config to PackageReference
   - Updated Newtonsoft.Json to 13.0.3
   ```
4. Create PR description including:
   - List of upgraded projects
   - Major dependency version changes
   - Known breaking changes and mitigations
   - Test execution results
5. Update project documentation:
   - README.md with new target framework
   - Developer setup instructions
   - Deployment environment requirements

# Output Contract

## Deliverables

1. **Upgraded Project Files**: All `.csproj` files updated to target `net8.0` (or specified version)
2. **PackageReference Migration**: Any converted `packages.config` projects with dependencies preserved
3. **Modernized Code**: Updated source files with deprecated patterns replaced
4. **Working Build**: Successful `dotnet build` with no errors
5. **Passing Tests**: All tests execute successfully (`dotnet test` passes)
6. **Updated CI/CD**: Pipeline configurations using .NET 8 SDK
7. **Documentation**: PR description and commit messages documenting the upgrade

## Validation Criteria

- [ ] All projects build without errors
- [ ] All tests pass
- [ ] Application runs locally without runtime exceptions
- [ ] CI/CD pipeline executes successfully on PR
- [ ] No vulnerable or deprecated package references remain
- [ ] Code review feedback addressed

# Failure Handling

## Build Failures

- **Compilation errors**: Check for missing using statements, renamed APIs, or moved types. Search Microsoft documentation for API migration guides.
- **Package restore errors**: Verify package sources are accessible. Check for typos in package names or versions. Explicitly add missing transitive dependencies.
- **Project reference errors**: Ensure referenced projects are upgraded first. Update `ProjectReference` paths if project locations changed.

## Runtime Failures

- **Configuration errors**: Verify `appsettings.json` structure matches .NET 8 expectations. Check for renamed configuration keys.
- **DI container errors**: Update service registrations for any changed constructors or renamed services.
- **Serialization errors**: If using System.Text.Json, verify serialization options match Newtonsoft.Json behavior if migrating.

## Test Failures

- **Test framework incompatibility**: Update xUnit/NUnit/MSTest to latest versions. Check test project TargetFramework matches SUT.
- **Integration test failures**: Verify test databases, mocks, or external services are accessible. Update test configuration files.

## Rollback Strategy

If critical issues are discovered:
1. Revert to the pre-upgrade branch/commit
2. Document blocking issues for future resolution
3. Consider partial upgrade (some projects to .NET 6/7 as intermediate step)

# Next Steps

- **skill-evaluation**: Run evaluation tests to validate this upgrade skill
- **skill-safety-review**: Review for any unsafe operations in upgrade scripts
- **skill-provenance**: Document the origin and trust level of this upgrade approach
- **skill-improver**: Refine based on specific edge cases encountered

# References

- [.NET Upgrade Assistant Documentation](https://learn.microsoft.com/en-us/dotnet/core/porting/upgrade-assistant-overview)
- [.NET 8 Breaking Changes](https://learn.microsoft.com/en-us/dotnet/core/compatibility/8.0)
- [Migrate from ASP.NET Core 6.0 to 8.0](https://learn.microsoft.com/en-us/aspnet/core/migration/60-80)
- [Migrate from .NET Framework to .NET 8](https://learn.microsoft.com/en-us/dotnet/core/porting/)
- [Azure Functions migration guide](https://learn.microsoft.com/en-us/azure/azure-functions/migrate-dotnet-to-isolated-model)
