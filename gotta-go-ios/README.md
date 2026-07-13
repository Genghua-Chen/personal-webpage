# Gotta Go NYC — iOS app

A native SwiftUI iPhone app version of the web [restroom finder](../restroom-finder/).
Full-screen MapKit map with a persistent bottom sheet: search, access filters,
"find nearest" (CoreLocation), tap-to-copy door codes, and one-tap Apple Maps
walking directions.

It reads the **same data** as the website — `GottaGoNYC/restrooms.csv` is a copy
of `restroom-finder/restrooms.csv`.

## Requirements
- **Xcode 16 or newer** (the project uses file-system-synchronized groups).
- iOS 17+ target (iPhone only, portrait).

## Run it
1. Open `GottaGoNYC.xcodeproj` in Xcode.
2. Pick an iPhone simulator (e.g. iPhone 16) or a connected device.
3. Press ⌘R.

For a real device you'll need to set a Team under
**Signing & Capabilities** (the bundle id is `com.lazysheep.GottaGoNYC`; change it
if it collides).

## Project layout
```
GottaGoNYC/
  GottaGoNYCApp.swift   – @main entry point
  ContentView.swift     – Map + persistent bottom sheet, camera control
  SheetView.swift       – search, filter chips, "nearest", the list
  RestroomRow.swift     – list card: badges, copy-code, directions
  Models.swift          – Restroom, Access (colors/emoji), categories
  RestroomStore.swift   – loads + parses restrooms.csv
  LocationManager.swift – CoreLocation wrapper
  Utils.swift           – distance/format helpers + shared filter
  restrooms.csv         – bundled data (keep in sync with the web copy)
  Assets.xcassets       – AccentColor (#38e1c6); AppIcon (toilet on teal→blue gradient)
```

## Keeping data in sync
The CSV is duplicated so the app can bundle it. After editing the website's
`restroom-finder/restrooms.csv`, refresh the app copy:

```sh
cp restroom-finder/restrooms.csv gotta-go-ios/GottaGoNYC/restrooms.csv
```

## Not done yet
- No App Store distribution setup (needs an Apple Developer account).
