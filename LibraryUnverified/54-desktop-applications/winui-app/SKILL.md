---
name: winui-app
description: Create, develop, and refine WinUI 3 desktop applications using C# and the Windows App SDK. Triggers on requests to bootstrap new WinUI projects, set up development environments, implement WinUI controls and navigation, apply Fluent Design theming, or troubleshoot WinUI-specific build and runtime issues.
---

> Source: https://github.com/openai/skills/tree/main/skills/.curated skills/.curated/winui-app

## Purpose

Provide grounded, step-by-step guidance for building modern Windows desktop applications with WinUI 3 and the Windows App SDK. This skill bridges Microsoft Learn documentation, WinUI Gallery patterns, and CommunityToolkit components into concrete implementation decisions for C#-first WinUI development.

## When to use

Use this skill when the request involves:

- **New project creation**: Bootstrapping a brand new WinUI 3 application (packaged or unpackaged)
- **Environment setup**: Installing or verifying WinUI prerequisites (Visual Studio, Windows SDK, .NET, Developer Mode)
- **Control implementation**: Adding or modifying WinUI controls, navigation shells, command surfaces, or page layouts
- **Design system work**: Applying Mica/Acrylic materials, Fluent typography, responsive layouts, or light/dark theming
- **Troubleshooting**: Diagnosing WinUI-specific build failures (MSB3073, XamlCompiler.exe), startup crashes, or packaging issues
- **Architecture decisions**: Choosing between packaged vs unpackaged deployment, navigation patterns, or shell composition
- **Review and remediation**: Auditing existing WinUI code for accessibility, performance, or platform alignment

## When NOT to use

Do not use this skill when:

- The request involves WPF, Windows Forms, UWP (non-WinUI 3), or cross-platform frameworks (MAUI, Avalonia, Uno)
- The task is general C# development without WinUI-specific concerns (use general coding assistance)
- The request is for backend services, web APIs, or non-Windows platforms
- The task involves Windows system administration or registry changes unrelated to WinUI development
- The project is already a mature, established codebase with strong conventions that should be preserved as-is (follow existing patterns instead)

## Procedure

1. **Classify the task** as environment/setup, new-app bootstrap, design/implementation, review, or troubleshooting.

2. **For environment setup or new-app bootstrap** (first priority - use bundled workflow):
   - Pick the app name when the request is for a new app. Derive a short PascalCase name if none given.
   - Create the project in the user's current workspace unless another location was specified.
   - Run the bundled WinGet configuration:
     ```powershell
     winget configure -f config.yaml --accept-configuration-agreements --disable-interactivity
     ```
   - Verify the template is available: `dotnet new list winui`
   - For diagnostics-only environment requests, explain the bundled bootstrap may change the machine and get confirmation. If declined, use `references/foundation-environment-audit-and-remediation.md` for manual verification.
   - Scaffold with: `dotnet new winui -o <name>`
   - Supported template options only: `-f|--framework net10.0|net9.0|net8.0`, `-slnx|--use-slnx`, `-cpm|--central-pkg-mgmt`, `-mvvm|--use-mvvm`, `-imt|--include-mvvm-toolkit`, `-un|--unpackaged`, `-nsf|--no-solution-file`, `--force`. Do not invent unsupported flags.
   - Verify the scaffold by confirming the `.csproj` exists and running `dotnet build`.
   - Launch the app through the correct packaged/unpackaged path and confirm a real top-level window appears.

3. **For design, implementation, or troubleshooting** (after setup is verified):
   - Read `references/_sections.md`, then load only the reference files matching the task.
   - Make the packaging model explicit before creating or refactoring. Default to packaged for Store workflows; unpackaged for CLI build-and-run loops.
   - For opaque XAML compiler failures (MSB3073, XamlCompiler.exe), read `references/foundation-template-first-recovery.md` and simplify toward the template scaffold before custom recovery.

4. **For any work that creates or changes a WinUI app**:
   - Make complete but minimal edits, then build and run the app before responding.
   - Do this by default even when not explicitly requested.
   - If a running app instance locks output while more work remains, stop it, rebuild, relaunch, and continue.
   - Leave the final verified app instance running unless the user explicitly asked not to.
   - Treat launch verification as incomplete until the app shows objective success: responsive top-level window, expected title, or clear startup behavior. A spawned process alone is not sufficient.

5. **Design and implementation principles**:
   - Prefer Microsoft Learn for API expectations and platform guidance.
   - Prefer WinUI Gallery for concrete control usage and design details.
   - Prefer WindowsAppSDK-Samples for scenario-level APIs (windowing, lifecycle, notifications).
   - Build toward WinUI and Fluent guidance first. Treat native WinUI shells and controls as the default path.
   - For grouped command surfaces, favor native `CommandBar` before custom button groupings.
   - Do not invent bespoke component libraries or custom chrome to replace stock WinUI behavior unless explicitly requested or required by existing design system.
   - When customization is needed, first compose, template, or restyle built-in WinUI controls before adding CommunityToolkit dependencies.
   - Use CommunityToolkit only when built-in WinUI controls do not cover the need cleanly.
   - Support both light and dark mode by default. Use theme-aware resources and system brushes instead of hard-coded colors.
   - Make scroll ownership explicit for collection layouts. Do not assume nested scroll-owning collections will render correctly within scrolling pages.
   - Avoid extra `Border` wrappers unless doing distinct work the contained control does not provide.
   - Treat responsiveness as a shell-plus-page problem, not just control-resize. Plan explicit wide, medium, and phone-width behavior.

## Output contract

Every interaction with this skill produces:

- **Verified code changes**: All WinUI code edits are accompanied by successful build and launch verification
- **Explicit packaging model**: Clear documentation of whether the app is packaged or unpackaged, with rationale
- **Reference citations**: Guidance is anchored to Microsoft Learn, WinUI Gallery, or WindowsAppSDK-Samples sources
- **Working application**: A running WinUI app instance (left active unless user requested otherwise) demonstrating the implemented functionality
- **Environment status**: For setup tasks, clear report of present/missing/uncertain prerequisites with next steps

## Failure handling

### Environment failures
- If `winget configure` fails but the `winui` template is available and toolchain is usable, note the partial failure and continue
- If prerequisites remain missing after setup flow, stop and report the blocker clearly without inventing alternate install recipes
- If `config.yaml` is missing, state this clearly and fall back to official Microsoft workflow instead of pretending the bundled path exists

### Build and XAML failures
- For `MSB3073` or `XamlCompiler.exe` errors, simplify toward the `dotnet new winui` template scaffold before structural changes
- Run a clean build once if diagnostics appear stale before deeper surgery
- Restore complex startup pieces incrementally after a clean build succeeds
- Prefer restoring template-generated shared-resource state over moving styles inline as the long-term fix

### Launch and runtime failures
- Separate environment problems from app-code startup crashes
- Inspect startup path (`App.xaml`, merged dictionaries, converters, `MainWindow`) if the app exits before showing a window
- Compare current app against fresh `dotnet new winui` scaffold for startup or manifest issues
- Guard package-identity assumptions when using unpackaged startup (e.g., `Windows.Storage.ApplicationData.Current` can fail)
- Fail closed on ambiguous launch results. If the app did not clearly open, continue debugging instead of declaring success

### User-decline scenarios
- If user declines machine changes for audit-only requests, use manual verification from `references/foundation-environment-audit-and-remediation.md` and summarize readiness under: present, missing, uncertain, recommended optional tools
- Keep uncertain signals explicit instead of implying success

## Next steps

After completing WinUI work:

- **For new projects**: Consider reading `references/testing-debugging-and-review-checklists.md` for a final review pass
- **For design refinements**: Reference `references/performance-diagnostics-and-responsiveness.md` if the app handles large collections or needs responsiveness tuning
- **For deployment preparation**: Read `references/windows-app-sdk-lifecycle-notifications-and-deployment.md` for lifecycle and packaging decisions
- **For accessibility audit**: Reference `references/accessibility-input-and-localization.md` before considering the app production-ready

## References

| Request | Read first |
| --- | --- |
| Check whether this PC can build WinUI apps | `references/foundation-environment-audit-and-remediation.md` |
| Install missing WinUI prerequisites | `references/foundation-environment-audit-and-remediation.md` |
| Start a new packaged or unpackaged app | `references/foundation-setup-and-project-selection.md` |
| Recover from XAML compiler or startup failures | `references/foundation-template-first-recovery.md` |
| Build, run, or verify that a WinUI app launched | `references/build-run-and-launch-verification.md` |
| Review app structure, pages, resources, and bindings | `references/foundation-winui-app-structure.md` |
| Choose shell, navigation, title bar, or multi-window patterns | `references/shell-navigation-and-windowing.md` |
| Choose controls or responsive layout patterns | `references/controls-layout-and-adaptive-ui.md` |
| Apply Mica, theming, typography, icons, or Fluent styling | `references/styling-theming-materials-and-icons.md` |
| Improve accessibility, keyboarding, or localization | `references/accessibility-input-and-localization.md` |
| Diagnose responsiveness or UI-thread performance | `references/performance-diagnostics-and-responsiveness.md` |
| Decide whether to use CommunityToolkit | `references/community-toolkit-controls-and-helpers.md` |
| Handle lifecycle, notifications, or deployment | `references/windows-app-sdk-lifecycle-notifications-and-deployment.md` |
| Run a review checklist | `references/testing-debugging-and-review-checklists.md` |

### Reference rules

- Keep C# as the primary path. Mention C++ or C++/WinRT only when the difference is material.
- Preserve the conventions of an existing codebase instead of forcing a generic sample structure onto it.
- Treat WinUI design guidance and native controls as the baseline. Do not drift into bespoke component systems unless explicitly requested or required by existing codebase.
- Support light and dark mode by default unless explicitly asked for single-theme result or product already enforces one.
- Favor built-in WinUI controls and system styling hooks before adding CommunityToolkit dependencies, custom controls, or app-specific surface systems.
- Put detailed control, theming, shell, scrolling, responsiveness, packaging, and recovery guidance in the matching reference files instead of duplicating those rules here.
