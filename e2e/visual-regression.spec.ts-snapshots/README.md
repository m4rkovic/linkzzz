# Visual regression baselines

The previous PNGs were captured while the global Tailwind/PostCSS stylesheet
was not loading. They showed an unformatted application, so they were removed
instead of being accepted as the product's intended design.

On the Windows reference machine, set `E2E_DATABASE_URL` to the disposable test
database. The runner applies migrations and seeds it before capture:

The E2E server also normalizes the shared `skyhook` analytics and Smart Link
update timestamps after seeding. Visual snapshots therefore compare the actual KPI
and date text instead of masking those regions.

```powershell
npm.cmd run test:e2e:visual:update
```

Inspect all ten generated PNGs (desktop and mobile) once, then use this as the
normal regression command:

```powershell
npm.cmd run test:e2e:visual
```

The application uses locally bundled Geist assets plus an explicit Arial body
fallback, so this capture does not depend on Google Fonts or a network request.
