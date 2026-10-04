# 08: APK trên CI và GitHub Release

**What to build:** CI builds a debug APK on every pull request and uploads it as a workflow artifact (a broken Capacitor setup fails the PR). A manual `release-android` workflow builds, from `main`, an APK signed with the maintainer's upload key (from GitHub secrets) and attaches it to a GitHub Release tagged with the version. `versionName` comes from `package.json` (`0.x` in this phase); `versionCode` from the workflow run number. A short guide in the repo explains how the maintainer creates the upload key with `keytool` and adds it to secrets; the key is never committed.

**Blocked by:** 07

**PR:** D

**Status:** ready-for-agent

- [ ] Debug APK built and uploaded on every PR
- [ ] Release workflow produces a signed APK on a GitHub Release
- [ ] Upload-key guide in the repo; no key material in git
- [ ] An APK from a Release installs over an older Release APK and keeps the Kỷ lục
