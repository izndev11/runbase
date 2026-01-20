const express = require('express');
const cors = require('cors');
const { PrismaClient } = require('@prisma/client'); // Importa a conexão com o banco

const app = express();
const prisma = new PrismaClient(); // Inicializa o Prisma

app.use(cors());
app.use(express.json());

// Rota de busca de eventos (Agora lendo do MySQL)
app.get('/api/eventos', async (req, res) => { // Note o 'async'
    const termoBusca = req.query.nome;

    try {
        const eventosBanco = await prisma.evento.findMany({
            where: termoBusca ? {
                nome: { contains: termoBusca } // O Prisma faz o filtro direto no SQL
            } : {}
        });
        return res.json(eventosBanco);
    } catch (error) {
        res.status(500).json({ error: "Erro ao buscar eventos" });
    }
});

// Rota de inscrição (Agora salvando no MySQL)
app.post('/api/inscrever', async (req, res) => {
    const { usuarioId, eventoId } = req.body;

    // Busca o evento no banco para checar vagas
    const evento = await prisma.evento.findUnique({
        where: { id: eventoId }
    });

    if (!evento || evento.vagas <= 0) {
        return res.status(400).json({ mensagem: 'Evento sem vagas ou não encontrado.' });
    }

    // Cria a inscrição no banco e atualiza o evento em uma "Transação"
    // Isso garante que se um falhar, o outro não acontece (segurança de dados)
    try {
        const resultado = await prisma.$transaction([
            prisma.inscricao.create({
                data: {
                    usuarioId: parseInt(usuarioId),
                    eventoId: eventoId,
                    valor: evento.preco,
                    status: 'Pendente'
                }
            }),
            prisma.evento.update({
                where: { id: eventoId },
                data: { vagas: { decrement: 1 } } // Diminui o número de vagas no banco
            })
        ]);

        res.status(201).json({ 
            mensagem: 'Inscrição salva no banco com sucesso!', 
            inscricao: resultado[0] 
        });
    } catch (error) {
        res.status(500).json({ error: "Erro ao processar inscrição" });
    }
});

const PORTA = 3000;
app.listen(PORTA, () => {
    console.log(`Servidor rodando em http://localhost:${PORTA}`);
});

fetch('http://localhost:3000/api/eventos')
  .then(res => res.json())
  .then(data => console.log("✅ Conexão OK! Dados recebidos:", data))
  .catch(err => console.error("❌ Erro de link: O Front não achou o Back", err));