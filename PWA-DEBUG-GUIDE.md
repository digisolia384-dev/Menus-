PWA-DEBUG-GUIDE.md
# 🔧 MenuOS PWA — Guide de Débogage

## ✅ Corrections Apportées

### 1. **manifest.json** ✓
- ✅ Changé `start_url` de `./menuos-saas-v12.html` → `./index.html`
- ✅ Ajouté `screenshots` array
- ✅ Corrigé URLs des shortcuts

### 2. **pwa-register.js** (NEW) ✓
- ✅ Script de registration automatique du Service Worker
- ✅ Gestion des mises à jour
- ✅ Détection online/offline
- ✅ Prompt d'installation PWA

### 3. **sw.js** (Amélioré) ✓
- ✅ Meilleure gestion des assets optionnels (icônes)
- ✅ Meilleur logging
- ✅ Fallback amélioré

---

## 📋 Actions Requises Maintenant

### **ÉTAPE 1 : Mettre à jour index.html**

Dans le `<head>` de `index.html`, **REMPLACER** :
```html
<link rel="manifest" href="manifest.json"/>
```

**PAR** :
```html
<!-- Manifest & Icons -->
<link rel="manifest" href="manifest.json"/>
<link rel="icon" type="image/png" href="icon-192.png"/>
<link rel="apple-touch-icon" href="icon-192.png"/>

<!-- Theme & Status Bar -->
<meta name="theme-color" content="#1A6B3C"/>
<meta name="apple-mobile-web-app-capable" content="yes"/>
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent"/>
<meta name="apple-mobile-web-app-title" content="MenuOS"/>

<!-- Viewport -->
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover"/>

<!-- Description & Colors -->
<meta name="description" content="Le menu digital pour chaque restaurant — commandes WhatsApp, Mobile Money, fidélité"/>
<meta name="msapplication-TileColor" content="#0D0D0D"/>
<meta name="msapplication-navbutton-color" content="#1A6B3C"/>
```

**Et avant le `</body>` ferment**, ajouter :
```html
<!-- Service Worker Registration -->
<script src="./pwa-register.js" defer></script>
```

### **ÉTAPE 2 : Créer les icônes PWA**

Vous **DEVEZ** créer/ajouter ces fichiers à la racine :
- `icon-192.png` (192x192 pixels)
- `icon-512.png` (512x512 pixels)

**Options rapides** :
1. Utiliser votre logo existant et le redimensionner
2. Générer sur [favicon-generator.org](https://www.favicon-generator.org/)
3. Ou utiliser cette image test (base64) :

```html
<!-- Test temporaire dans index.html (à remplacer par de vrais fichiers) -->
<link rel="icon" type="image/svg+xml" href="data:image/svg+xml,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 192 192'><rect fill='%231A6B3C' width='192' height='192'/><text x='50%' y='50%' font-size='80' fill='white' text-anchor='middle' dominant-baseline='central'>M</text></svg>"/>
```

### **ÉTAPE 3 : S'assurer que HTTPS est activé**

PWA nécessite **HTTPS** en production (except localhost).

Vérifier :
```bash
# Si deployé sur Firebase
firebase deploy

# Si sur un serveur custom
# → Configurer SSL/TLS certificate
```

---

## 🧪 Tests de Débogage

### **Dans Chrome DevTools** (F12)

1. **Vérifier la registration** :
   - Aller à → Application → Service Workers
   - Vous devez voir "menuos-v2.1" registered

2. **Vérifier le Manifest** :
   - Aller à → Application → Manifest
   - Doit afficher tous les champs

3. **Vérifier le Cache** :
   - Aller à → Application → Cache Storage
   - Voir "menuos-v2.1-static" et "menuos-v2.1-dynamic"

4. **Simuler offline** :
   - Application → Service Workers → ☑️ Offline
   - Rafraîchir → Doit voir le contenu en cache

### **Tests Console** (F12 → Console)

```javascript
// Vérifier la registration
navigator.serviceWorker.getRegistrations().then(regs => {
  console.log('SW registrations:', regs);
});

// Vérifier les caches
caches.keys().then(keys => {
  console.log('Cache keys:', keys);
});

// Forcer une mise à jour
navigator.serviceWorker.getRegistrations().then(regs => {
  regs[0].update();
});
```

### **Test d'Installation (mobile/desktop)**

1. Sur Chrome : Menu → "Installer MenuOS"
2. Sur Safari iOS : Partager → Ajouter à l'écran d'accueil

---

## ⚠️ Problèmes Courants & Solutions

### **"Service Worker enregistré mais PWA ne s'installe pas"**
- ✅ Vérifier que manifest.json est valide (test sur [web.dev](https://web.dev/check))
- ✅ Vérifier les icônes existent et sont valides PNG
- ✅ Vérifier HTTPS activé
- ✅ Vérifier `display: "standalone"` dans manifest.json

### **"Service Worker activation échoue"**
- ✅ Vérifier les URLs de precache existent
- ✅ Voir console pour erreurs détaillées
- ✅ Nettoyer cache : DevTools → Application → Clear site data

### **"Application "hors ligne" même en ligne"**
- ✅ Vérifier que pwa-register.js charge correctement
- ✅ Vérifier event listeners online/offline :
  ```javascript
  window.dispatchEvent(new Event('online'));
  ```

---

## 📊 Checklist PWA Complète

- [ ] ✅ manifest.json valide
- [ ] ✅ icon-192.png créé
- [ ] ✅ icon-512.png créé
- [ ] ✅ pwa-register.js chargé
- [ ] ✅ Meta tags PWA dans `<head>`
- [ ] ✅ Service Worker registered
- [ ] ✅ HTTPS activé (ou localhost)
- [ ] ✅ Tested offline mode
- [ ] ✅ Tested installation prompt
- [ ] ✅ Tested in DevTools

---

## 📱 Test Multi-Dispositifs

### **Android (Chrome)**
1. Ouvrir l'app
2. Bouton menu (⋮) → "Installer"
3. Vérifier sur l'écran d'accueil

### **iPhone (Safari)**
1. Ouvrir l'app
2. Partager (↗) → "Ajouter à l'écran d'accueil"
3. Vérifier dans la bibliothèque

### **Desktop (Chrome)**
1. URL bar → Bouton "Installer"
2. Vérifier dans Ctrl+Shift+M (App mode)

---

## 🔗 Ressources

- [web.dev - PWA Checklist](https://web.dev/pwa-checklist/)
- [MDN - Service Workers](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Manifest Validator](https://web.dev/check)
- [Firebase Hosting + PWA](https://firebase.google.com/docs/hosting)

---

**Besoin d'aide ? Consultez la console du navigateur (F12) pour voir les erreurs détaillées !** 🚀
