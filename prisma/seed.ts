import "dotenv/config";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const usuario = await prisma.usuario.create({
    data: {
      nome_completo: "JoÃ£o Silva",
      email: "joao@email.com",
      cpf: "12345678900",
      senha_hash: "hash123",
      data_nascimento: new Date("1995-01-01"),
    },
  });

  const evento = await prisma.evento.create({
    data: {
      titulo: "Corrida da Cidade",
      dataEvento: new Date("2026-05-10"),
      local: "SÃ£o Paulo",
    },
  });

  await prisma.categoria.create({
    data: {
      nome: "5km",
      eventoId: evento.id,
    },
  });

  await prisma.inscricao.create({
    data: {
      usuarioId: usuario.id,
      eventoId: evento.id,
    },
  });

  console.log("Seed concluÃ­do ðŸš€");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
