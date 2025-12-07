# Multilanguage Feature Implementation Guide

## Overview
This guide explains how to implement the multilanguage feature across the AyurMitra application, specifically for the Navbar, Book Appointment, and Patient Dashboard components.

## Implementation Summary

### 1. Translation System Setup

**Files Created:**
- `src/context/LanguageContext.jsx` - Global language context provider
- `src/i18n/translations_te_addon.js` - Telugu translations addon (to be merged)
- `src/components/AppointmentBooking_i18n.jsx` - Internationalized AppointmentBooking component

**Files Modified:**
- `src/i18n/translations.js` - Extended with Navbar and AppointmentBooking translations for all 4 languages (English, Hindi, Odia, Telugu)

### 2. Supported Languages
- **English (en)** - Default
- **Hindi (hi)** - हिंदी
- **Odia (or)** - ଓଡ଼ିଆ
- **Telugu (te)** - తెలుగు

### 3. Key Features Implemented

#### A. Language Context Provider
```javascript
// src/context/LanguageContext.jsx
import { LanguageProvider, useLanguage } from './context/LanguageContext';

// Wrap your app
<LanguageProvider>
  <App />
</LanguageProvider>

// Use in components
const { language, changeLanguage, t } = useLanguage();
```

#### B. Translation Keys Added

**Navbar Translations:**
- home, aboutUs, services, contact, profile
- signUp, login, signOut
- choosePortal, selectRole
- patient, vaidya, therapist, admin
- patientDesc, vaidyaDesc, therapistDesc, adminDesc
- newToAyurMitra, createAccount
- endSession, signOutConfirm, cancel, online

**Appointment Booking Translations:**
- getAIRecommendations, findingBestDoctors
- patientInformation, tellUsSymptoms
- age, enterAge, gender, selectGender
- male, female, other
- describeSymptoms, symptomsPlaceholder
- severityLevel, severeSevere, severeDesc
- moderate, moderateDesc, mild, mildDesc
- back, backToDashboard
- aiPoweredRecommendations
- recommendedSpecialists, basedOnSymptoms
- schedule, yearsExp
- availableSlots, loadingSlots
- noSlotsToday, tryAnotherDate
- minutesSession, bookingConfirmed
- time, oopsSomethingWrong
- fillRequired, noDoctorsMatched, serverError

## Step-by-Step Implementation

### Step 1: Update Main App Component

```javascript
// src/main.jsx or src/App.jsx
import { LanguageProvider } from './context/LanguageContext';

function App() {
  return (
    <LanguageProvider>
      {/* Your existing app structure */}
    </LanguageProvider>
  );
}
```

### Step 2: Update PatientDashboard

The PatientDashboard already has language support implemented. It:
1. Stores language in localStorage
2. Passes language to child components
3. Uses translations from `translations.js`

**Current Implementation:**
```javascript
const [language, setLanguage] = useState(localStorage.getItem('language') || 'en');
const t = translations[language];

const handleLanguageChange = (lang) => {
  setLanguage(lang);
  localStorage.setItem('language', lang);
};
```

### Step 3: Update Navbar Component

Replace the existing Navbar with translation support:

```javascript
import { translations } from '../i18n/translations';

const Navbar = ({ language = 'en', onLanguageChange }) => {
  const t = translations[language] || translations.en;
  
  // Use t.home, t.aboutUs, t.services, etc. instead of hardcoded strings
  return (
    <nav>
      <button>{t.home}</button>
      <button>{t.aboutUs}</button>
      {/* ... */}
    </nav>
  );
};
```

### Step 4: Update AppointmentBooking Component

Replace the existing AppointmentBooking with the internationalized version:

```javascript
// Option 1: Use the new component directly
import AppointmentBooking from './components/AppointmentBooking_i18n';

// Option 2: Update existing component
import { translations } from '../i18n/translations';

export default function AppointmentBooking({ language = 'en' }) {
  const t = translations[language] || translations.en;
  
  // Replace all hardcoded strings with t.keyName
}
```

### Step 5: Complete Telugu Translations

Manually merge the Telugu translations from `src/i18n/translations_te_addon.js` into the `te` object in `src/i18n/translations.js`.

**Current Telugu object location:**
```javascript
// src/i18n/translations.js
export const translations = {
  en: { /* ... */ },
  hi: { /* ... */ },
  or: { /* ... */ },
  te: {
    // Add all fields from translations_te_addon.js here
    home: "హోమ్",
    aboutUs: "మా గురించి",
    // ... rest of translations
  }
};
```

### Step 6: Update Child Components

For components like ConsultationHistory, PatientPrescriptions, etc., pass the language prop:

```javascript
// In PatientDashboard
<ConsultationHistory language={language} />
<PatientPrescriptions language={language} />
<AppointmentBooking language={language} />
```

Then update each component to accept and use the language prop:

```javascript
const ConsultationHistory = ({ language = 'en' }) => {
  const t = translations[language] || translations.en;
  // Use t.keyName for all text
};
```

## Testing the Implementation

### 1. Test Language Switching
```javascript
// In PatientDashboard, the LanguageSwitcher should:
// 1. Display current language
// 2. Show dropdown with all 4 languages
// 3. Update localStorage on change
// 4. Re-render all components with new language
```

### 2. Test Each Component
- **Navbar**: All menu items, buttons, and modals should translate
- **AppointmentBooking**: Form labels, placeholders, buttons, error messages
- **PatientDashboard**: Sidebar, headers, stats, progress indicators

### 3. Test Persistence
- Change language
- Refresh page
- Language should persist from localStorage

## Common Issues and Solutions

### Issue 1: Missing Translation Keys
**Solution:** Add fallback to English
```javascript
const t = translations[language] || translations.en;
const text = t.keyName || translations.en.keyName || 'Fallback Text';
```

### Issue 2: Component Not Re-rendering
**Solution:** Ensure language is passed as prop and component uses it in render

### Issue 3: Special Characters Not Displaying
**Solution:** Ensure UTF-8 encoding in all files
```javascript
// Add to HTML head
<meta charset="UTF-8">
```

## Best Practices

1. **Always use translation keys** - Never hardcode user-facing text
2. **Provide fallbacks** - Always fallback to English if translation missing
3. **Keep keys consistent** - Use camelCase for all translation keys
4. **Group related translations** - Keep related keys together in the translations object
5. **Test all languages** - Verify each language displays correctly
6. **Handle dynamic content** - Use template strings for dynamic values:
   ```javascript
   `${t.youHaveCompleted} ${count} ${t.sessions}`
   ```

## Future Enhancements

1. **Add more languages** - Extend translations object with new language codes
2. **RTL Support** - Add right-to-left support for Arabic, Hebrew, etc.
3. **Lazy loading** - Load translations on demand to reduce bundle size
4. **Translation management** - Use a CMS or translation management system
5. **Pluralization** - Handle singular/plural forms properly
6. **Date/Time formatting** - Use locale-specific formatting

## File Structure

```
src/
├── i18n/
│   ├── translations.js (Main translations file - UPDATED)
│   └── translations_te_addon.js (Telugu addon - TO BE MERGED)
├── context/
│   └── LanguageContext.jsx (NEW - Global language context)
├── components/
│   ├── LanguageSwitcher.jsx (Existing - Already working)
│   ├── Navbar.jsx (TO BE UPDATED with translations)
│   ├── AppointmentBooking.jsx (TO BE REPLACED)
│   └── AppointmentBooking_i18n.jsx (NEW - Internationalized version)
└── pages/
    └── PatientDashboard.jsx (Already has language support)
```

## Quick Start Checklist

- [ ] Merge Telugu translations from addon file
- [ ] Wrap app with LanguageProvider
- [ ] Update Navbar to use translations
- [ ] Replace AppointmentBooking with i18n version
- [ ] Pass language prop to all child components
- [ ] Test language switching in browser
- [ ] Verify localStorage persistence
- [ ] Test all 4 languages
- [ ] Check mobile responsiveness
- [ ] Verify all text is translated

## Support

For issues or questions:
1. Check translation keys in `src/i18n/translations.js`
2. Verify language prop is passed correctly
3. Check browser console for errors
4. Ensure localStorage has 'language' key

## Conclusion

This implementation provides a robust multilanguage system that:
- Supports 4 languages out of the box
- Persists user language preference
- Provides easy-to-use translation system
- Allows for easy addition of new languages
- Maintains consistent UX across all languages

The system is designed to be maintainable, scalable, and user-friendly.
