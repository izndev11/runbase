import { Resend } from "resend";

const resendApiKey = process.env.RESEND_API_KEY || "";
const emailFrom = process.env.EMAIL_FROM || "no-reply@speedrun.local";
const appUrl = process.env.APP_URL || "http://localhost:5500/front-end";

const resend = resendApiKey ? new Resend(resendApiKey) : null;

function canSendEmail() {
  return Boolean(resend && resendApiKey && emailFrom);
}

export async function sendInscricaoEmail(params: {
  to: string;
  nome: string;
  eventoTitulo: string;
  dataEvento?: Date | null;
  local?: string | null;
  inscricaoId: number;
}) {
  if (!canSendEmail()) return;

  const dataFmt = params.dataEvento
    ? params.dataEvento.toLocaleDateString("pt-BR")
    : "a confirmar";

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111;">
      <h2>Inscrição confirmada!</h2>
      <p>Olá, ${params.nome}.</p>
      <p>Sua inscrição foi registrada com sucesso.</p>
      <p><strong>Evento:</strong> ${params.eventoTitulo}</p>
      <p><strong>Data:</strong> ${dataFmt}</p>
      <p><strong>Local:</strong> ${params.local || "-"}</p>
      <p><strong>Inscrição:</strong> #${params.inscricaoId}</p>
      <p>Você pode acompanhar seus pedidos em: ${appUrl}/minhas-inscricoes.html</p>
    </div>
  `;

  await resend!.emails.send({
    from: emailFrom,
    to: params.to,
    subject: "Confirmação de inscrição",
    html,
  });
}

export async function sendPagamentoEmail(params: {
  to: string;
  nome: string;
  eventoTitulo: string;
  valor?: number | null;
  inscricaoId: number;
}) {
  if (!canSendEmail()) return;

  const valorFmt =
    typeof params.valor === "number"
      ? params.valor.toLocaleString("pt-BR", {
          style: "currency",
          currency: "BRL",
        })
      : "—";

  const html = `
    <div style="font-family: Arial, sans-serif; color: #111;">
      <h2>Pagamento confirmado!</h2>
      <p>Olá, ${params.nome}.</p>
      <p>Recebemos o pagamento da sua inscrição.</p>
      <p><strong>Evento:</strong> ${params.eventoTitulo}</p>
      <p><strong>Valor:</strong> ${valorFmt}</p>
      <p><strong>Inscrição:</strong> #${params.inscricaoId}</p>
      <p>Obrigado por participar.</p>
    </div>
  `;

  await resend!.emails.send({
    from: emailFrom,
    to: params.to,
    subject: "Pagamento confirmado",
    html,
  });
}
