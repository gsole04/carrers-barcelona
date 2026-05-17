# Carrers de Barcelona 🗺️

Quiz interactiu per posar a prova el domini dels carrers de Barcelona, amb IA (Claude) com a game master.

## Com funciona

L'app genera cruïlles reals de Barcelona i demana al jugador que navegui pels carrers seguint instruccions ("Puges per Numància, quin carrer trobes?"). Claude valida les respostes amb flexibilitat.

## Estructura

```
carrers-barcelona/
├── index.html
├── package.json
├── vite.config.js
└── src/
    ├── main.jsx
    └── App.jsx        ← component principal (barcelona-carrers.jsx.txt)
```

## Configuració

1. Reanomena `barcelona-carrers.jsx.txt` → `src/App.jsx`
2. Instal·la dependències:
   ```bash
   npm install
   ```
3. Executa en local:
   ```bash
   npm run dev
   ```

## Desplegament a Vercel

1. Connecta el repo a [vercel.com](https://vercel.com)
2. Framework: **Vite**
3. Afegeix la variable d'entorn (si cal)
4. Deploy!
