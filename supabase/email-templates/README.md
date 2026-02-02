# Templates email (Supabase Auth)

Ces templates sont a coller dans la console Supabase:
Authentication -> Email Templates.

Utiliser la meme charte pour:
- Invite user
- Reset password

Variable principale utilisee: {{ .ConfirmationURL }}
(elle est fournie par Supabase pour les emails d'invitation et de reset).

Conseil: desactiver la confirmation d'email si l'inscription est invite-only.
Dans Supabase: Authentication -> Providers -> Email -> Disable "Confirm email".
