# Carte du Jour

Application web mobile-first pour restaurateurs permettant de gérer et publier leur menu du jour.

## Stack technique

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Database & Auth**: Supabase
- **Styling**: Tailwind CSS

## Installation

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer Supabase

1. Créer un projet sur [supabase.com](https://supabase.com)
2. Copier le fichier d'environnement :

```bash
cp .env.local.example .env.local
```

3. Remplir les variables dans `.env.local` :

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
```

> Les valeurs se trouvent dans : Supabase Dashboard → Settings → API

### 3. Créer les tables dans Supabase

1. Aller dans le SQL Editor de Supabase
2. Copier/coller le contenu de `supabase/schema.sql`
3. Exécuter le script

### 4. Créer un compte et insérer les produits

1. Lancer l'app (`npm run dev`)
2. Créer un compte via `/signup`
3. Retourner dans le SQL Editor de Supabase
4. Exécuter `supabase/seed.sql` pour insérer les 18 produits

### 5. Lancer le serveur de développement

```bash
npm run dev
```

Ouvrir [http://localhost:3000](http://localhost:3000)

## Structure du projet

```
├── app/
│   ├── (auth)/           # Pages d'authentification
│   │   ├── login/
│   │   ├── signup/
│   │   └── callback/
│   ├── (dashboard)/      # Pages protégées (dashboard)
│   │   └── dashboard/
│   │       ├── page.tsx        # Menu du jour
│   │       ├── produits/       # Gestion produits
│   │       └── parametres/     # Paramètres
│   ├── (public)/         # Pages publiques
│   │   └── menu/[slug]/  # Menu public du restaurant
│   └── api/              # Route handlers
├── components/
│   ├── layout/           # Header, MobileNav
│   └── ui/               # Button, Input
├── lib/
│   ├── supabase/         # Clients Supabase (browser, server, middleware)
│   ├── types/            # Types TypeScript
│   └── auth.ts           # Helpers d'authentification
└── supabase/
    ├── schema.sql        # Schema de base de données
    └── seed.sql          # Données initiales (18 produits)
```

## Checklist "ça marche"

- [ ] `npm run dev` démarre sans erreur
- [ ] Page d'accueil accessible sur http://localhost:3000
- [ ] Page `/login` affiche le formulaire
- [ ] Page `/signup` affiche le formulaire
- [ ] Après signup, redirection vers `/dashboard`
- [ ] Dashboard protégé (redirect si non connecté)
- [ ] Navigation mobile fonctionne

## Scripts disponibles

```bash
npm run dev      # Serveur de développement
npm run build    # Build de production
npm run start    # Serveur de production
npm run lint     # Vérification ESLint
```

## Déploiement Vercel

### Variables d'environnement

Configurer ces variables dans Vercel (Settings → Environment Variables) :

| Variable | Description | Exemple |
|----------|-------------|---------|
| `NEXT_PUBLIC_SUPABASE_URL` | URL de votre projet Supabase | `https://xxx.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Clé publique anonyme Supabase | `eyJhbGciOiJIUzI1...` |
| `NEXT_PUBLIC_SITE_URL` | URL de votre site déployé | `https://monapp.vercel.app` |

### Configuration Supabase pour Production

1. **Site URL** : Dans Supabase Dashboard → Authentication → URL Configuration
   - Définir **Site URL** : `https://votre-app.vercel.app`

2. **Redirect URLs** : Ajouter ces URLs autorisées :
   ```
   https://votre-app.vercel.app/callback
   https://votre-app.vercel.app/**
   ```

3. **Email Templates** (optionnel) : Dans Authentication → Email Templates
   - Personnaliser les emails de confirmation et magic link

### Déploiement

```bash
# Option 1: CLI Vercel
npm i -g vercel
vercel

# Option 2: GitHub/GitLab
# Connecter le repo dans le dashboard Vercel
```

### Notes techniques

- **PDF** : Impression navigateur via `window.print()` + CSS @media print (pas de serveur)
- **Compatible** : Vercel Hobby (pas de dépendances lourdes comme Puppeteer)

### Checklist Déploiement Production

- [ ] Variables d'environnement configurées sur Vercel
- [ ] `NEXT_PUBLIC_SITE_URL` pointe vers l'URL Vercel
- [ ] Site URL configuré dans Supabase Auth
- [ ] Redirect URLs ajoutées dans Supabase Auth
- [ ] Build Vercel réussi (vérifier les logs)
- [ ] Authentification email/password fonctionne
- [ ] Authentification magic link fonctionne
- [ ] Menu public accessible via slug
- [ ] Bouton "Télécharger PDF" ouvre la page print et déclenche l'impression

## Fonctionnalités

### Authentification
- **Email + Mot de passe** : Connexion classique
- **Magic Link** : Connexion sans mot de passe via email

### Menu du jour
- Sélection des produits disponibles
- Réorganisation par drag (à venir)
- Duplication depuis hier
- Toggle affichage des prix

### Export PDF
- **Impression navigateur** (window.print) - pas de serveur PDF
- Style bistrot parisien (Le Severo)
- Format A4 via CSS @media print
- Compatible tous navigateurs (desktop + mobile)
- Sur mobile iOS : Partager → Imprimer → Enregistrer en PDF
