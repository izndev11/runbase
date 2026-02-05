import { Router } from "express";
import { prisma } from "../lib/prisma";
import { authMiddleware } from "../middlewares/auth";
import { sendPagamentoEmail } from "../utils/email";

const router = Router();

const mpAccessTokenTest = process.env.MP_ACCESS_TOKEN_TEST || "";

async function criarPagamentoPixMercadoPago(params: {
  amount: number;
  descricao: string;
  email: string;
  nome: string;
}) {
  if (!mpAccessTokenTest) return null;
  const payload = {
    transaction_amount: Number(params.amount),
    description: params.descricao,
    payment_method_id: "pix",
    payer: {
      email: params.email,
      first_name: params.nome,
    },
  };

  const response = await fetch("https://api.mercadopago.com/v1/payments", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${mpAccessTokenTest}`,
      "Content-Type": "application/json",
      "X-Idempotency-Key": crypto.randomUUID(),
    },
    body: JSON.stringify(payload),
  });

  const data = await response.json();
  if (!response.ok) {
    throw new Error(data?.message || "Erro ao criar pagamento Pix");
  }

  const tx = data?.point_of_interaction?.transaction_data;
  return {
    mp_payment_id: data?.id,
    pix_qr_code: tx?.qr_code,
    pix_qr_code_base64: tx?.qr_code_base64,
    ticket_url: tx?.ticket_url,
  };
}

router.post("/", authMiddleware, async (req, res) => {
  const { inscricaoId, metodo, valor, opcaoId } = req.body;
  const usuarioId = req.userId;

  if (!usuarioId) {
    return res.status(401).json({ error: "Usuário não autenticado" });
  }

  if (!inscricaoId || !metodo) {
    return res.status(400).json({ error: "Dados obrigatórios" });
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
    return res.status(404).json({ error: "Inscrição não encontrada" });
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
      return res.status(400).json({ error: "Opção inválida para este evento" });
    }
    valorBase = opcao.preco;
    taxaPercentual = opcao.taxa_percentual;
    valorTaxa = Number(((valorBase * taxaPercentual) / 100).toFixed(2));
    valorFinal = Number((valorBase + valorTaxa).toFixed(2));
    opcaoIdFinal = opcao.id;
  }

  if (!valorFinal) {
    return res.status(400).json({ error: "Valor inválido" });
  }

  const pagamento = await prisma.pagamento.create({
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
  try {
    if (metodo === "PIX" && inscricao.usuario?.email) {
      pixData = await criarPagamentoPixMercadoPago({
        amount: valorFinal,
        descricao: inscricao.evento?.titulo || "Inscrição",
        email: inscricao.usuario.email,
        nome: inscricao.usuario.nome_completo || "Participante",
      });
    }
  } catch (error) {
    console.error("Erro ao gerar Pix:", error);
  }

  return res.json({ ...pagamento, pix: pixData });
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
