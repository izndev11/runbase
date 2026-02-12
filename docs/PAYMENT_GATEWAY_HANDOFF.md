# Payment Gateway Handoff

This project is prepared to run in sandbox now and switch to production later by changing environment variables only.

## 1) Current safe setup (sandbox/default)

Set:

```env
PAYMENT_PROVIDER=PIX_MANUAL
GATEWAY_ENV=SANDBOX
```

This keeps payment flow testable without owner credentials.

## 2) When owner credentials arrive

Update:

```env
PAYMENT_PROVIDER=ASAAS
GATEWAY_ENV=PRODUCTION
ASAAS_API_KEY_PRODUCTION=...
ASAAS_BASE_URL_PRODUCTION=https://api.asaas.com/v3
```

Keep `ASAAS_API_KEY_SANDBOX` for rollback tests.

## 3) Validation steps after switching

1. Restart API service.
2. Create one new registration.
3. Create payment with `metodo=PIX`.
4. Confirm QR/payload is returned by API.
5. Confirm webhook URL on provider panel (if enabled in your flow).
6. Mark one payment as paid and verify status/email behavior.

## 4) Rollback plan

If production credentials fail:

1. Set `PAYMENT_PROVIDER=PIX_MANUAL`.
2. Restart API.
3. Continue operations using manual PIX while credentials are fixed.

