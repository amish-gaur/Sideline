# Build Resources

This directory contains icons and other resources needed for building distributable packages.

## Icons Required

### macOS (icon.icns)
You need to create an `.icns` file containing multiple sizes:
- 16x16
- 32x32
- 128x128
- 256x256
- 512x512
- 1024x1024

**How to create:**
1. Create a folder named `icon.iconset`
2. Add PNG files named:
   - `icon_16x16.png`
   - `icon_16x16@2x.png` (32x32)
   - `icon_32x32.png`
   - `icon_32x32@2x.png` (64x64)
   - `icon_128x128.png`
   - `icon_128x128@2x.png` (256x256)
   - `icon_256x256.png`
   - `icon_256x256@2x.png` (512x512)
   - `icon_512x512.png`
   - `icon_512x512@2x.png` (1024x1024)
3. Run: `iconutil -c icns icon.iconset -o icon.icns`
4. Move `icon.icns` to this `build/` directory

**Or use an online tool:**
- https://cloudconvert.com/png-to-icns
- Upload a 1024x1024 PNG and download the `.icns` file

### Windows (icon.ico)
You need an `.ico` file containing multiple sizes:
- 16x16
- 32x32
- 48x48
- 256x256

**How to create:**
1. Create PNG files at the sizes above
2. Use an online converter: https://cloudconvert.com/png-to-ico
3. Upload all sizes or just a 256x256 PNG (it will generate the rest)
4. Download `icon.ico` and place it in this `build/` directory

### Linux (icon.png)
A single PNG file:
- 512x512 or 1024x1024 recommended

**How to create:**
1. Create a square PNG at 512x512 or 1024x1024
2. Save as `icon.png` in this `build/` directory

## Quick Start

If you don't have icons yet, you can still build the app—electron-builder will use a default icon. To add your own icons later:

1. Create your icon designs (square, transparent background recommended)
2. Generate the required formats using the methods above
3. Place them in this `build/` directory:
   - `build/icon.icns` (macOS)
   - `build/icon.ico` (Windows)
   - `build/icon.png` (Linux)

The build process will automatically find and use these icons.
