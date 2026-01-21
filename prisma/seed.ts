import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  console.log('Seed rodando sem dor de cabeça 🚀')
}

main()
  .catch(console.error)
  .finally(async () => {
    await prisma.$disconnect()
  })
