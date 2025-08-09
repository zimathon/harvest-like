# Page snapshot

```yaml
- heading "Harvest-like" [level=2]
- paragraph: Sign in to your account
- group:
  - text: Email
  - textbox "Email": invalid@example.com
- group:
  - text: Password
  - textbox "Password": wrongpassword
  - button:
    - img
- button "Sign In"
- paragraph: For demo purposes, you can use any email and password
- region "Notifications-top"
- region "Notifications-top-left"
- region "Notifications-top-right"
- region "Notifications-bottom-left"
- region "Notifications-bottom":
  - status:
    - img
    - text: Login failed Invalid email or password
    - button "Close"
- region "Notifications-bottom-right"
```