import express from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3001;
const API_KEY = process.env.GROQ_API_KEY;

const URL_API = "https://api.groq.com/openai/v1/chat/completions";
const MODELO = "openai/gpt-oss-120b"; // Ou "openai/gpt-oss-20b" para respostas ainda mais rápidas

app.use(express.json());
app.use(cors());
app.use(express.static('public'));

const usuarios = [];

app.post('/cadastro', (req, res) => {
    const { usuario, email, senha } = req.body;
    if (!usuario || !email || !senha) return res.status(400).json({ erro: "Preencha todos os campos!" });
    if (senha.length < 6) return res.status(400).json({ erro: "A senha deve ter pelo menos 6 caracteres!" });
    const emailExiste = usuarios.find((busca) => busca.email.toLowerCase() === email.toLowerCase());
    if (emailExiste) return res.status(409).json({ erro: "E-mail já cadastrado!" });
    usuarios.push({ usuario, email, senha });
    return res.status(201).json({ mensagem: "Cadastro realizado com sucesso!" });
});

app.post('/login', (req, res) => {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ erro: "Preencha e-mail e senha para entrar!" });
    const usuarioEncontrado = usuarios.find((busca) => busca.email.toLowerCase() === email.toLowerCase());
    if (!usuarioEncontrado || usuarioEncontrado.senha !== senha) return res.status(401).json({ erro: "E-mail ou senha incorretos!" });
    return res.json({ mensagem: "Login realizado com sucesso!", usuario: usuarioEncontrado.usuario });
});

app.post('/chat', async (req, res) => {
    try {
        const { message, historico } = req.body;

        if (!message && (!historico || historico.length === 0)) {
            return res.status(400).json({ erro: "Mensagem vazia." });
        }

        const mensagensUsuario = historico || [{ role: "user", content: message }];

        const persona = [
            {
                role: "system",
                content: "Você é o Homem-Aranha, super inteligente, Responda de forma curta, sem usar muitas girias, sem falar muito de teias pq n faz sentido. se apresente como homem aranha, e as repostas podem ser atrapalhadas beeeeeem as vezes, simulando um nervosismo sabe, classico do homem aranha mas apenas quando perguntarem dos vingadores e ou algo dele sabe, se ele é o peter parker, sobre ned, mj, tia may, ele ficar nervosos, mentindo,e nada de parenteses na respostas,  e sem mandar mensagens muito grandes., bem-humorada, cheia de piadas e muito objetiva, agindo exatamente como o homem aranha mesmo, sem revelar ser o peter obv, ajude e responda as perguntas com fatos quando necessario, e de maneira eficiente e atualizada,caso nao tenha uma resposta necessaria, responda de uma maneira curta e direta, você falará com mais reponsabilidade, fale de forma atualizada.. você gosta da mj, tem seu melhor amig ned, lembre de sua conexão com os vingadores, e todos os acontecimentos dos ultimos filmes, voce é o homem aranha do tom holland ok... preciso que fale com melancolia e saudade dos vingadores, pq querendo ou nao voce esta afastado, tony morreu, assim como natasha e ademais, e tem novos herois e tals obv mas lembre do feitiço lançado onde todos esqueceram de voce, sua ex namorada, seu amigo, use informaçoes dos filmes do homem aranha:longe de casa, homem aranha: sem volta pra casa, mas use essas informaçoes apenas se o questionarem sobre isso, e lembre de nao revelar dele ser o peter parker, apenas assim, responda de maneira curta e direta. com a personalidade do homem aranha," },
            ...mensagensUsuario
        ];

        const respostaBruta = await fetch(URL_API, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${API_KEY}`
            },
            body: JSON.stringify({
                model: MODELO,
                messages: persona
            })
        });

        const resultado = await respostaBruta.json();

        if (!respostaBruta.ok) {
            console.error("Erro retornado pela API:", resultado);
            return res.status(500).json({ erro: "Erro de processamento da IA." });
        }

        const respostaIA = resultado.choices[0].message.content;

        return res.json({
            reply: respostaIA,
            resposta: respostaIA
        });

    } catch (erro) {
        console.error("Erro no servidor:", erro);
        return res.status(500).json({ erro: "Falha interna no servidor." });
    }
});

app.listen(PORT, () => {
    console.log(`Servidor rodando em http://localhost:${PORT}`);
});