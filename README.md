# SLAY MOTO — PWA starter

A responsive Progressive Web App starter for motorcycle ride tracking, using a restrained black + Tiffany-blue visual system.

## Included
- Responsive dashboard and map (Leaflet + OpenStreetMap tiles)
- GPS ride recording with start, pause, resume and end
- Distance, elapsed time, average speed and max speed
- Recorded GPS track displayed on the map
- Local ride history saved in the browser
- Basic destination lookup and route preview using public Nominatim + OSRM demo services
- PWA manifest and service worker

## Run locally
GPS requires a secure context (HTTPS or localhost).

```bash
cd slay-moto
python -m http.server 8000
```

Open http://localhost:8000

## Deploy
Upload the folder contents to GitHub Pages, Netlify, or another static HTTPS host. Keep the directory structure unchanged.

## Important limitations before public launch
1. This is a functional MVP, not certified motorcycle navigation.
2. Browser GPS accuracy varies by device, mounting position, weather, buildings and signal conditions. The app filters low-quality fixes and obvious jumps, but recorded distance is still an estimate.
3. Public Nominatim and OSRM demo endpoints are for prototyping and have usage policies, rate limits and no production SLA. Replace them with a suitable commercial or self-hosted geocoding/routing provider before launch.
4. The route preview currently uses a generic car profile. Do not present it as motorcycle-optimized routing.
5. No live bend-speed recommendation is implemented. A safe bend warning needs reliable road geometry, direction of travel, curve radius, posted limits, surface/traffic/weather data, conservative validation and extensive real-world testing. Do not infer a safe cornering speed from GPS alone.
6. Browser background execution is limited. For reliable continuous tracking with the screen locked, a native app or a dedicated background-location implementation may be required. Test on target devices.
7. Use only while parked or with a secure mount and voice guidance. Never operate the screen while riding.

## Next production steps
- Replace demo routing/geocoding with a licensed provider and motorcycle profile.
- Add account authentication, cloud sync, ride export (GPX), privacy controls and deletion.
- Add route-aware spoken prompts and validated curve-context alerts.
- Test GPS smoothing, battery use, offline map strategy and background tracking on real phones.
