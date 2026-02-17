# Entrega - Site Corridas (SpeedRun)

## 1. URLs de producao
- Frontend: `https://speedrun-ybnb.onrender.com`
- API: `https://runbase.onrender.com`

## 2. Arquitetura atual
- Frontend estatico no Render (Static Site)
- Backend Node/Express + Prisma no Render (Web Service)
- Banco PostgreSQL no Neon
- Pagamento via Mercado Pago (checkout), com opcao Pix e Cartao

## 3. Variaveis obrigatorias (Backend Render)
Definir em `runbase -> Environment`:

- `NODE_ENV=production`
- `DATABASE_URL=postgresql://...`
- `JWT_SECRET=...`
- `APP_URL=https://speedrun-ybnb.onrender.com`
- `RESEND_API_KEY=...`
- `EMAIL_FROM=SpeedRun <no-reply@seu-dominio.com>`
- `PAYMENT_PROVIDER=MERCADO_PAGO`
- `GATEWAY_ENV=PRODUCTION`
- `MP_ACCESS_TOKEN_PRODUCTION=...`

Opcional para testes:
- `MP_ACCESS_TOKEN_TEST=...`

## 4. Deploy (Backend)
No Render (`runbase -> Settings -> Build & Deploy`):

- Build Command:
```bash
npm install --include=dev && npx prisma generate && npx prisma migrate deploy && npm run build
```

- Start Command:
```bash
npm start
```

## 5. Deploy (Frontend)
No Render Static Site:
- Root Directory: `front-end`
- Build Command: vazio (ou `echo ok`)
- Publish Directory: `.`

## 6. Checklist de validacao final
1. Cadastro e login funcionando (`/login.html`)
2. Usuario comum acessa inscricao e pedidos
3. Admin acessa painel e cria/edita evento
4. Inscricao abre checkout Mercado Pago
5. Fluxo testado com Pix e Cartao
6. Pagina mobile sem quebra visual critica

## 7. Troca para conta do cliente (Mercado Pago)
1. Cliente cria/acessa app no Mercado Pago Developers
2. Cliente envia `Access Token` de producao
3. Atualizar no Render:
   - `MP_ACCESS_TOKEN_PRODUCTION`
4. Confirmar:
   - `PAYMENT_PROVIDER=MERCADO_PAGO`
   - `GATEWAY_ENV=PRODUCTION`
5. Fazer novo deploy do backend

## 8. Seguranca
- Nao commitar `.env` no Git
- Rotacionar tokens/chaves usados em desenvolvimento
- Nunca solicitar senha da conta Mercado Pago do cliente
- Usar apenas token tecnico no backend

## 9. Operacao rapida (comandos uteis local)
```bash
npm install
npx tsc --noEmit
npm run dev
```

## 10. Observacoes
- Atualmente o pagamento abre checkout Mercado Pago conforme opcao escolhida (Pix/Cartao).
- Se quiser confirmacao automatica de status no sistema apos pagamento, proxima etapa recomendada: webhook do Mercado Pago.
