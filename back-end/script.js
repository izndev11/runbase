const express = require('express');
const cors = require('cors');

const app = express();

app.use(cors());
app.use(express.json());

let eventos = [
    { id: 1, nome: 'Corrida 1', data: '2026-03-02', preco: 45, vagas: 100 },
    { id: 2, nome: 'Corrida 2', data: '2026-01-19', preco: 45, vagas: 100},
    { id: 3, nome: 'Corrida 3', data: '2026-01-26', preco: 45, vagas: 100}
];

let inscricoes = [];

// rota de busca de eventos (faz o campo procurar eventos apartir do filtro ou do texto digitado)//
api.get('api/eventos', (req, res) => {
    const termoBusca = req.query.nome;

    if (termoBusca) {
        const filtrados = eventos.filter(evento => evento.nome.toLowerCase().includes(termoBusca.toLowerCase()));
        return res.json(filtrados);
    }

    return res.json(eventos);
});

// rota de inscrição nos eventos //
api.post('/api/inscrever', (req, res) => {
    //envio do id do usuario, id do evento e categoria da inscrição//
    const { usuarioId, eventoId, categoria } = req.body;
    //verifica se há vagas disponíveis no evento//
    const evento = eventos.find(evento => evento.id === eventoId);

    if (evento.vagas <= 0) {
        return res.status(400).json({ mensagem: 'Evento sem vagas disponíveis.' });
    }

    const novaInscricao = {
        idInscricao: Math.random().toString(36).substr(2, 9),
        usuarioId,
        eventoId,
        status: 'Pendente', //fica como pendente até o pagamento ser confirmado//
        valor: evento.preco,
    };

    inscricoes.push(novaInscricao);
    evento.vagas--; //diminui o número de vagas disponíveis//

    res.status(201).json({ 
        mensagem: 'Inscrição realizada com sucesso.', 
        inscricao: novaInscricao 
    });
});

const PORTA = 3000;
app.listen(PORTA, () => {
    console.log(`Servidor rodando em http://localhost:${PORTA}`);
    console.log("O seu front-end agora pode pedir dados para este endereço!");
});




