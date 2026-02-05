import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  const senha_hash = await bcrypt.hash("123456", 10);
  const usuario = await prisma.usuario.create({
    data: {
      nome_completo: "João Silva",
      email: "joao@email.com",
      cpf: "12345678900",
      senha_hash,
      sexo: "masculino",
      data_nascimento: new Date("1995-01-01"),
    },
  });

  const adminSenhaHash = await bcrypt.hash("admin123", 10);
  await prisma.usuario.create({
    data: {
      nome_completo: "Admin SpeedRun",
      email: "admin@speedrun.com",
      cpf: "00000000000",
      senha_hash: adminSenhaHash,
      sexo: "masculino",
      role: "ADMIN",
      data_nascimento: new Date("1990-01-01"),
    },
  });

  const evento = await prisma.evento.create({
    data: {
      titulo: "Corrida da Cidade",
      dataEvento: new Date("2026-05-10"),
      local: "São Paulo",
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

  console.log("Seed concluído 🚀");
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect();
  });
