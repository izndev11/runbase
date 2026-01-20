import { PrismaClient } from '@prisma/client'

// No Prisma 7.2.0, usamos datasourceUrl diretamente
const prisma = new PrismaClient()

async function main() {
  console.log('--- Iniciando teste de banco de dados ---');

  const novoUsuario = await prisma.usuario.create({
    data: {
      nome_completo: 'Usuario Teste', 
      email: 'teste@email.com',
      senha_hash: '123456',
      cpf: '123.456.789-00',
      data_nascimento: new Date('2000-01-01'),
    },
  });

  console.log('Usuário criado com sucesso:', novoUsuario);
}

main()
  .catch((e) => {
    console.error('Erro de execução:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });