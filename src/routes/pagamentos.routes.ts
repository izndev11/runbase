import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middlewares/auth";
import { sendPagamentoEmail } from "../utils/email";

const router = Router();

type PaymentProvider = "PIX_MANUAL" | "ASAAS" | "MERCADO_PAGO";
type GatewayEnv = "SANDBOX" | "PRODUCTION";

const PAYMENT_PROVIDER = (
  process.env.PAYMENT_PROVIDER || "PIX_MANUAL"
).toUpperCase() as PaymentProvider;

const GATEWAY_ENV = (
  process.env.GATEWAY_ENV || "SANDBOX"
).toUpperCase() as GatewayEnv;

function getAsaasConfig() {
  const sandbox = {
    apiKey: process.env.ASAAS_API_KEY_SANDBOX || "",
    baseUrl:
      process.env.ASAAS_BASE_URL_SANDBOX || "https://api-sandbox.asaas.com/v3",
  };

  const production = {
    apiKey: process.env.ASAAS_API_KEY_PRODUCTION || "",
    baseUrl: process.env.ASAAS_BASE_URL_PRODUCTION || "https://api.asaas.com/v3",
  };

  return GATEWAY_ENV === "PRODUCTION" ? production : sandbox;
}

function getMercadoPagoAccessToken() {
  if (GATEWAY_ENV === "PRODUCTION") {
    return process.env.MP_ACCESS_TOKEN_PRODUCTION || "";
  }
  return process.env.MP_ACCESS_TOKEN_TEST || "";
}

function getAppUrl() {
  const raw = process.env.APP_URL || "";
  return raw.endsWith("/") ? raw.slice(0, -1) : raw;
}

async function criarCheckoutMercadoPago(params: {
  amount: number;
  descricao: string;
  email?: string | null;
  inscricaoId: number;
  paymentMode: "PIX" | "CARD";
}) {
  const accessToken = getMercadoPagoAccessToken();
  if (!accessToken) {
    throw new Error("Mercado Pago access token nao configurado para o ambiente atual");
  }

  const appUrl = getAppUrl();
  const backUrl = appUrl ? `${appUrl}/pedidos.html` : undefined;

  const response = await fetch("https://api.mercadopago.com/checkout/preferences", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${accessToken}`,
    },
    body: JSON.stringify({
      items: [
        {
          title: params.descricao || "Inscricao",
          quantity: 1,
          currency_id: "BRL",
          unit_price: Number(params.amount),
        },
      ],
      payer: params.email ? { email: params.email } : undefined,
      external_reference: String(params.inscricaoId),
      payment_methods:
        params.paymentMode === "PIX"
          ? {
              default_payment_method_id: "pix",
              excluded_payment_types: [
                { id: "credit_card" },
                { id: "debit_card" },
                { id: "prepaid_card" },
                { id: "ticket" },
                { id: "atm" },
              ],
            }
          : {
              excluded_payment_types: [
                { id: "ticket" },
                { id: "atm" },
                { id: "bank_transfer" },
              ],
            },
      back_urls: backUrl
        ? {
            success: backUrl,
            pending: backUrl,
            failure: backUrl,
          }
        : undefined,
      auto_return: backUrl ? "approved" : undefined,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Erro ao criar checkout no Mercado Pago");
  }

  return {
    id: data.id as string,
    url: (GATEWAY_ENV === "PRODUCTION" ? data.init_point : data.sandbox_init_point) || data.init_point,
  };
}

async function criarClienteAsaas(params: {
  nome: string;
  email: string;
  cpfCnpj: string;
}) {
  const config = getAsaasConfig();

  if (!config.apiKey) {
    throw new Error("Asaas API key nao configurada para o ambiente atual");
  }

  const response = await fetch(`${config.baseUrl}/customers`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "speedrun",
      access_token: config.apiKey,
    },
    body: JSON.stringify({
      name: params.nome,
      email: params.email,
      cpfCnpj: params.cpfCnpj,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.errors?.[0]?.description || "Erro ao criar cliente Asaas");
  }
  return data.id as string;
}

async function criarPagamentoPixAsaas(params: {
  amount: number;
  descricao: string;
  email: string;
  nome: string;
  cpfCnpj: string;
}) {
  const customerId = await criarClienteAsaas({
    nome: params.nome,
    email: params.email,
    cpfCnpj: params.cpfCnpj,
  });

  const config = getAsaasConfig();
  if (!config.apiKey) {
    throw new Error("Asaas API key nao configurada para o ambiente atual");
  }

  const dueDate = new Date();
  dueDate.setDate(dueDate.getDate() + 1);
  const dueDateStr = dueDate.toISOString().slice(0, 10);

  const response = await fetch(`${config.baseUrl}/payments`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "speedrun",
      access_token: config.apiKey,
    },
    body: JSON.stringify({
      customer: customerId,
      billingType: "PIX",
      value: Number(params.amount),
      dueDate: dueDateStr,
      description: params.descricao,
    }),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.errors?.[0]?.description || "Erro ao criar pagamento Pix");
  }

  const pixResp = await fetch(`${config.baseUrl}/payments/${data.id}/pixQrCode`, {
    headers: {
      "Content-Type": "application/json",
      "User-Agent": "speedrun",
      access_token: config.apiKey,
    },
  });

  const pixData = await pixResp.json();
  if (!pixResp.ok) {
    throw new Error(pixData?.errors?.[0]?.description || "Erro ao obter QR Code Pix");
  }

  return {
    asaas_payment_id: data.id,
    pix_qr_code: pixData.payload,
    pix_qr_code_base64: pixData.encodedImage,
    ticket_url: pixData?.encodedImage ? null : null,
  };
}

router.post("/", authMiddleware, async (req, res) => {
  const { inscricaoId, metodo, valor, opcaoId, paymentMode } = req.body;
  const usuarioId = req.userId;

  if (!usuarioId) {
    return res.status(401).json({ error: "Usuario nao autenticado" });
  }

  if (!inscricaoId || !metodo) {
    return res.status(400).json({ error: "Dados obrigatorios" });
  }

  const inscricao = await prisma.inscricao.findFirst({
    where: {
      id: Number(inscricaoId),
      usuarioId,
    },
    include: {
      usuario: true,
      evento: true,
    },
  });

  if (!inscricao) {
    return res.status(404).json({ error: "Inscricao nao encontrada" });
  }

  let valorFinal = Number(valor ?? 0);
  let valorBase: number | null = null;
  let taxaPercentual: number | null = null;
  let valorTaxa: number | null = null;
  let opcaoIdFinal: number | null = null;

  if (opcaoId) {
    const opcao = await prisma.eventoOpcao.findUnique({
      where: { id: Number(opcaoId) },
    });

    if (!opcao || opcao.eventoId !== inscricao.eventoId) {
      return res.status(400).json({ error: "Opcao invalida para este evento" });
    }

    valorBase = opcao.preco;
    taxaPercentual = opcao.taxa_percentual;
    valorTaxa = Number(((valorBase * taxaPercentual) / 100).toFixed(2));
    valorFinal = Number((valorBase + valorTaxa).toFixed(2));
    opcaoIdFinal = opcao.id;
  }

  if (!valorFinal) {
    return res.status(400).json({ error: "Valor invalido" });
  }

  if (PAYMENT_PROVIDER === "PIX_MANUAL" && metodo === "CARD") {
    return res.status(400).json({
      error: "Cartao nao disponivel no modo PIX_MANUAL. Ative MERCADO_PAGO para cartao.",
    });
  }

  const pagamentoExistente = await prisma.pagamento.findUnique({
    where: { inscricaoId: Number(inscricaoId) },
  });

  const pagamento = pagamentoExistente
    ? pagamentoExistente
    : await prisma.pagamento.create({
        data: {
          valor: valorFinal,
          metodo,
          inscricaoId: Number(inscricaoId),
          opcaoId: opcaoIdFinal,
          valor_base: valorBase,
          taxa_percentual: taxaPercentual,
          valor_taxa: valorTaxa,
        },
      });

  let pixData = null;
  let pixError: string | null = null;
  let checkoutData: { id: string; url: string } | null = null;
  const mpPaymentMode: "PIX" | "CARD" = paymentMode === "CARD" ? "CARD" : "PIX";

  try {
    const usarPixManual = metodo === "PIX_MANUAL" || PAYMENT_PROVIDER === "PIX_MANUAL";

    if (PAYMENT_PROVIDER === "MERCADO_PAGO") {
      checkoutData = await criarCheckoutMercadoPago({
        amount: valorFinal,
        descricao: inscricao.evento?.titulo || "Inscricao",
        email: inscricao.usuario?.email,
        inscricaoId: Number(inscricaoId),
        paymentMode: mpPaymentMode,
      });
    } else if (usarPixManual) {
      pixData = {
        chave: inscricao.evento?.pix_chave || null,
        tipo: inscricao.evento?.pix_tipo || null,
        beneficiario: inscricao.evento?.pix_beneficiario || null,
        valor: valorFinal,
      };

      if (!pixData.chave) {
        pixError = "Pix manual sem chave configurada no evento";
      }
    } else if (
      metodo === "PIX" &&
      PAYMENT_PROVIDER === "ASAAS" &&
      inscricao.usuario?.email &&
      inscricao.usuario?.cpf
    ) {
      pixData = await criarPagamentoPixAsaas({
        amount: valorFinal,
        descricao: inscricao.evento?.titulo || "Inscricao",
        email: inscricao.usuario.email,
        nome: inscricao.usuario.nome_completo || "Participante",
        cpfCnpj: inscricao.usuario.cpf,
      });
    } else if (metodo === "PIX" && PAYMENT_PROVIDER !== "ASAAS") {
      pixError =
        "Provider PIX automatico nao configurado. Use PIX_MANUAL ou configure PAYMENT_PROVIDER=ASAAS";
    }
  } catch (error) {
    pixError = (error as Error)?.message || "Erro ao gerar Pix";
    console.error("Erro ao gerar Pix:", error);
  }

  return res.json({ ...pagamento, pix: pixData, pix_error: pixError, checkout: checkoutData });
});

router.patch("/:id/confirmar", authMiddleware, async (req, res) => {
  const { id } = req.params;

  const pagamento = await prisma.pagamento.update({
    where: { id: Number(id) },
    data: { status: "PAGO" },
    include: {
      inscricao: {
        include: { usuario: true, evento: true },
      },
      opcao: true,
    },
  });

  await prisma.inscricao.update({
    where: { id: pagamento.inscricaoId },
    data: { status: "PAGO" },
  });

  try {
    const usuario = pagamento.inscricao?.usuario;
    const evento = pagamento.inscricao?.evento;

    if (usuario?.email) {
      await sendPagamentoEmail({
        to: usuario.email,
        nome: usuario.nome_completo || "Participante",
        eventoTitulo: evento?.titulo || "Evento",
        valor: pagamento.valor,
        inscricaoId: pagamento.inscricaoId,
        opcaoTitulo: pagamento.opcao?.titulo,
        opcaoTipo: pagamento.opcao?.tipo,
        opcaoDistanciaKm: pagamento.opcao?.distancia_km,
      });
    }
  } catch (error) {
    console.error("Erro ao enviar e-mail de pagamento:", error);
  }

  return res.json({ message: "Pagamento confirmado" });
});

export default router;
