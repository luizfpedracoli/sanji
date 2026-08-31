const caixaPrincipal = document.querySelector(".caixa-principal");
const caixaPerguntas = document.querySelector(".caixa-perguntas");
const caixaAlternativas = document.querySelector(".caixa-alternativas");
const caixaResultado = document.querySelector(".caixa-resultado");
const textoResultado = document.querySelector(".texto-resultado");

const perguntas = [
    {
        enunciado: "Ao chegar na escola, você descobre que a instituição decidiu adotar ferramentas de inteligência artificial para auxiliar os alunos. Qual é a sua primeira reação?",
        alternativas: [
            "Acho uma excelente oportunidade para personalizar os estudos e tirar dúvidas mais rápido.",
            "Fico receoso com a possibilidade de perdermos a interação humana e a atenção dos professores."
        ]
    },
    {
        enunciado: "O professor passa um trabalho de pesquisa e permite o uso de IA e ferramentas digitais. Como você decide realizar a tarefa?",
        alternativas: [
            "Utilizo a IA para organizar ideias e estruturar o trabalho, verificando as fontes por conta própria.",
            "Copio a resposta gerada pela tecnologia para concluir a tarefa com o menor esforço possível."
        ]
    },
    {
        enunciado: "Durante a aula, o professor libera o uso de celulares para um jogo educativo interativo sobre a matéria. Como você aproveita esse momento?",
        alternativas: [
            "Participo do jogo com foco para aprender e fixar o conteúdo de maneira dinâmica.",
            "Aproveito que o celular está liberado para checar as redes sociais e enviar mensagens."
        ]
    },
    {
        enunciado: "A escola organiza um debate sobre o uso ético da tecnologia e privacidade de dados dos estudantes. Qual posição você defende?",
        alternativas: [
            "A tecnologia traz vantagens, mas precisamos de regras claras de segurança e uso consciente.",
            "O uso deve ser totalmente livre no ambiente escolar, sem restrições ou supervisão."
        ]
    },
    {
        enunciado: "Para o projeto final do ano, você precisa propor uma solução tecnológica para melhorar a escola. Qual ideia você apresenta?",
        alternativas: [
            "Desenvolver uma plataforma online de monitoria entre os próprios alunos para ajudar em matérias difíceis.",
            "Criar um grupo de jogos e entretenimento digital para os momentos de intervalo."
        ]
    }
];

let atual = 0;
let perguntaAtual;

botaoAlternativas.addEventListener("click", () => {
    respostaSelecionada(indice, botaoAlternativas);
});

function mostraAlternativas() {
    for (const alternativa of perguntaAtual.alternativas) {
        const botaoAlternativas = document.createElement("button");
        botaoAlternativas.textContent = alternativa;
        // Adiciona o evento de clique para avançar
        botaoAlternativas.addEventListener("click", () => respostaSelecionada());
        caixaAlternativas.appendChild(botaoAlternativas);
    }
}

function respostaSelecionada(indice) {

    if (indice === 0) {
        pontos++;
    }

    atual++;

    mostraPergunta();
}

function mostraResultado() {

    caixaPerguntas.textContent = "Fim do Questionário!";

    caixaAlternativas.textContent = "";

    progresso.textContent = "";

    textoResultado.textContent =
        `Você acertou ${pontos} de ${perguntas.length} perguntas!`;
}
caixaPerguntas.classList.remove("animar");

void caixaPerguntas.offsetWidth;

caixaPerguntas.classList.add("animar");
mostraPergunta();

const progresso = document.querySelector(".progresso");

let pontos = 0;

function respostaSelecionada(indice, botao) {

    if (indice === 0) {
        pontos++;
        botao.classList.add("correta");
    } else {
        botao.classList.add("incorreta");
    }

    setTimeout(() => {
        atual++;
        mostraPergunta();
    }, 500);
}
const botaoRecomecar = document.querySelector(".botao-recomecar");

botaoRecomecar.addEventListener("click", () => {
    atual = 0;
    pontos = 0;

    mostraPergunta();
});