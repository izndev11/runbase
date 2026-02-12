import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middlewares/auth";
import { sendPagamentoEmail } from "../utils/email";

const router = Router();

type PaymentProvider = "PIX_MANUAL" | "ASAAS";
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
  const { inscricaoId, metodo, valor, opcaoId } = req.body;
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

  try {
    const usarPixManual = metodo === "PIX_MANUAL" || PAYMENT_PROVIDER === "PIX_MANUAL";

    if (usarPixManual) {
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

  return res.json({ ...pagamento, pix: pixData, pix_error: pixError });
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
