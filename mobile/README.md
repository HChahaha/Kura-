# Kura Mobile App

A React Native + Expo mobile app for intelligent kitchen inventory management.

## Features

✅ **Offline-First Architecture** - SQLite database for local storage
✅ **Real-time Sync** - Automatic sync with backend when online
✅ **Push Notifications** - Expiry warnings, shopping reminders, recipe suggestions
✅ **Camera Support** - Photograph ingredients and recipes
✅ **Cross-Platform** - iOS and Android support
✅ **AI-Powered** - Gemini integration for recipe suggestions

## Prerequisites

- Node.js 16+
- Expo CLI: `npm install -g expo-cli`
- Xcode (for iOS) or Android Studio (for Android)
- Gemini API key
- Firebase project (optional)

## Installation

1. Install dependencies:
```bash
cd mobile
npm install
```

2. Create `.env.local` from `.env.example`:
```bash
cp .env.example .env.local
```

3. Add your API keys to `.env.local`

## Development

### Run on simulator/emulator

```bash
# iOS
npm run ios

# Android
npm run android

# Web (for testing)
npm run web
```

### Run with Expo Go

```bash
npm start
```

Then open Expo Go app and scan the QR code.

## Building for Production

### iOS

```bash
npm run build:ios
```

### Android

```bash
npm run build:android
```

## Architecture

### Offline-First
- SQLite database stores all data locally
- Sync queue tracks changes when offline
- Automatic sync when connection returns

### Services
- **offlineService.ts** - Local database operations
- **notificationService.ts** - Push notifications
- **syncService.ts** - Backend sync logic

### Screens
- **HomeScreen** - Dashboard with quick stats
- **PantryScreen** - Manage pantry inventory
- **RecipesScreen** - AI-suggested recipes
- **ShoppingListScreen** - Shopping list management

## Features in Development

- [ ] Camera integration for ingredient photos
- [ ] Gemini API for recipe suggestions
- [ ] Advanced filtering and search
- [ ] Recipe sharing
- [ ] Meal planning
- [ ] Barcode scanning

## Troubleshooting

### Notifications not working
- Ensure app has notification permissions
- Check `initializeNotifications()` in App.tsx
- Android: Check notification channel setup

### Offline sync issues
- Check sync queue in database
- Verify API endpoints in `.env.local`
- Check network connectivity

## Contributing

Please follow the TypeScript and React Native best practices.

## License

MIT
