# Page snapshot

```yaml
- generic [ref=e1]:
  - main [ref=e2]:
    - generic [ref=e4]:
      - generic [ref=e5]:
        - img "Stella Maris" [ref=e7]
        - generic [ref=e8]: Stella Maris Manager
        - generic [ref=e9]: Inicie sesión para gestionar las tareas de la guardería.
      - generic [ref=e10]:
        - generic [ref=e11]:
          - text: Email
          - textbox "Email" [ref=e12]:
            - /placeholder: empleado@stellamaris.com
            - text: admin@nauticastellamaris.com.ar
        - generic [ref=e13]:
          - text: Contraseña
          - generic [ref=e14]:
            - textbox "Contraseña" [ref=e15]: G3stion.Nautica2026!Sm
            - button "Mostrar contraseña" [ref=e16] [cursor=pointer]:
              - img [ref=e17]
      - button "Ingresar" [active] [ref=e21] [cursor=pointer]
  - region "Notifications (F8)":
    - list
  - button "Open Next.js Dev Tools" [ref=e27] [cursor=pointer]:
    - img [ref=e28]
  - alert [ref=e31]
```