# Сфера Android and website formulas rollout

Goal: reuse the verified 1.5.0 presentation adapter without changing app mathematics or inherited UI/auth.

- [ ] Record original website/APK source hashes and before screenshots.
- [ ] RED: test local assets, beta service-worker coverage and inherited inline script parity.
- [ ] GREEN: bundle the existing math directory, integrate beta only, run numerical and presentation suites.
- [ ] Publish only murbahir-sys/sfer main; verify /sfer/beta/ HTTP, rendering and offline caching.
- [ ] Promote identical markup to root; bump sfer-v6-formulas; retire beta as before; verify live/offline/mobile.
- [ ] Build original Android shell online with AGP 8.7.3; preserve engine/explain/native behavior, bump 2.2/code4 to 2.3/code5.
- [ ] Verify signature against 2.1, API23 instrumentation/screenshots, all regressions, APK hashes.
- [ ] Self-review, final local Android commit and published website commits; record limitations.

Deployment confirmed from GitHub Pages configuration: main branch, repository root, https://murbahir-sys.github.io/sfer/. No other repository is to be pushed. Root page remains unchanged during beta validation.
