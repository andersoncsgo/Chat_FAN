# FURIA Chat - Challenge #1: Experiência Conversacional FURIA

## 🚀 Descrição do Projeto

Este projeto foi desenvolvido como parte do Desafio Técnico para a vaga de **Assistente de Engenharia de Software** na FURIA Tech. O objetivo do Challenge #1 era criar uma **Experiência Conversacional** para os fãs da FURIA, focada no time de CS.

A aplicação consiste em um sistema de chat web em tempo real onde os fãs podem interagir em diferentes salas temáticas, usar emojis personalizados e alternar entre temas claro e escuro.

**Stack Principal:**

*   **Frontend Web:** React (com Vite)
*   **Backend:** Flask (com Flask-SocketIO)

---

## 🎥 Vídeo de Demonstração (Obrigatório)

Assista a um vídeo de ~3 minutos demonstrando a interação do fã com o chat web, incluindo a troca de salas e o uso de emojis:

**[➡️ Link para o Vídeo de Demonstração Aqui ⬅️]**
*(Substitua este texto pelo link real do seu vídeo no YouTube, Loom, Google Drive, etc.)*

---

## ✨ Funcionalidades Implementadas

*   **Conexão em Tempo Real:** Utiliza WebSockets (via Socket.IO) para comunicação instantânea.
*   **Autenticação Simples:** Entrada no chat com nome de usuário.
*   **Salas Temáticas:**
    *   Seleção de sala na tela inicial (#PartidaAoVivo, #Memes, #Notícias, #DiscussõesTáticas).
    *   Possibilidade de trocar de sala dentro da interface do chat.
    *   Mensagens são isoladas por sala.
*   **Notificações de Entrada/Saída:** Mensagens do sistema informam quando usuários entram ou saem da sala atual.
*   **Emojis Personalizados:** Suporte inicial a emojis (ex: `:badfallen:` é renderizado como a imagem correspondente).
*   **Interface Web Responsiva:** Frontend web funcional.
*   **Tema Claro/Escuro:** Botão no header para alternar entre os temas, com persistência da escolha no `localStorage`.
*   **Voltar para Seleção:** Clicar no logo da FURIA no header retorna o usuário para a tela inicial de seleção de sala/nome.

---

## 🛠️ Tecnologias Utilizadas

*   **Backend:**
    *   Python 3
    *   Flask
    *   Flask-SocketIO
    *   Flask-Cors
    *   python-engineio, python-socketio
    *   eventlet (Servidor WSGI assíncrono)
    *   uuid (Para IDs de mensagem)
*   **Frontend Web:**
    *   React 18+
    *   Vite (Build tool)
    *   JavaScript (JSX)
    *   CSS Modules
    *   socket.io-client
*   **Deploy (Backend):**
    *   Render.com (Web Service)
    *   Gunicorn (Servidor WSGI de produção)
*   **Controle de Versão:**
    *   Git & GitHub

---

## 📂 Estrutura do Projeto
Use code with caution.
Markdown
Furia/
├── backend/ # Aplicação Flask (API e WebSockets)
│ ├── app.py # Arquivo principal do servidor Flask/SocketIO
│ ├── requirements.txt # Dependências Python do backend
│ └── ... # (venv opcionalmente aqui dentro)
├── frontend-web/ # Aplicação React para Web
│ ├── public/
│ ├── src/
│ │ ├── assets/ # Imagens (logo, emojis), fontes, etc.
│ │ ├── components/ # Componentes React reutilizáveis (Header, Chat, Join)
│ │ ├── utils/ # Utilitários (ex: emojiParser)
│ │ ├── App.jsx # Componente principal da aplicação web
│ │ ├── App.css # Estilos globais e variáveis de tema
│ │ └── main.jsx # Ponto de entrada React
│ ├── index.html
│ ├── package.json # Dependências e scripts Node.js (web)
│ └── vite.config.js # Configuração do Vite
├── .gitignore # Arquivos a serem ignorados pelo Git
├── README.md # Este arquivo
└── ... # Outros arquivos de configuração (ex: .gitattributes)
---

## ⚙️ Configuração e Instalação

**Pré-requisitos:**

*   [Git](https://git-scm.com/)
*   [Node.js](https://nodejs.org/) (v18 ou superior recomendado) e npm/yarn
*   [Python](https://www.python.org/) (v3.10 ou superior recomendado) e pip

**Passos:**

1.  **Clonar o Repositório:**
    ```bash
    git clone [URL_DO_SEU_REPOSITORIO_GITHUB]
    cd Furia # Ou o nome que você deu à pasta raiz
    ```

2.  **Configurar o Backend (`backend/`):**
    ```bash
    cd backend
    # Criar ambiente virtual (recomendado)
    python -m venv venv
    # Ativar ambiente virtual
    # Windows:
    .\venv\Scripts\activate
    # Linux/macOS:
    source venv/bin/activate
    # Instalar dependências Python
    pip install -r requirements.txt
    ```
    *   **Observação:** Para rodar localmente, o backend iniciará em `http://localhost:5000`.

3.  **Configurar o Frontend Web (`frontend-web/`):**
    ```bash
    cd ../frontend-web # Voltar para raiz e entrar no frontend-web
    # Instalar dependências Node.js
    npm install
    # OU: yarn install
    ```
    *   **⚠️ Configuração Importante:** Abra o arquivo `src/App.jsx` e **altere a constante `SOCKET_SERVER_URL`**:
        *   Para conectar ao **backend local:** `const SOCKET_SERVER_URL = 'http://localhost:5000';`
        *   Para conectar ao **backend na Render:** `const SOCKET_SERVER_URL = 'https://chat-fan.onrender.com';` (Use a sua URL da Render)

---

## ▶️ Como Rodar

**1. Iniciar o Backend:**
   *   Navegue até a pasta `backend/`.
   *   Certifique-se de que o ambiente virtual está ativado.
   *   Execute:
     ```bash
     python app.py
     ```
   *   O servidor estará rodando (por padrão em `http://0.0.0.0:5000`).

**2. Iniciar o Frontend Web:**
   *   Navegue até a pasta `frontend-web/`.
   *   Execute:
     ```bash
     npm run dev
     # OU
     yarn dev
     ```
   *   Abra o navegador no endereço fornecido (geralmente `http://localhost:5173`).

**Importante:** Para o frontend se conectar corretamente, o backend precisa estar rodando e a `SOCKET_SERVER_URL` no arquivo `frontend-web/src/App.jsx` deve apontar para o endereço correto do backend (seja local ou na Render).

---

## 🔗 Backend Deployado

O backend desta aplicação está hospedado na plataforma Render e pode ser acessado (para conexões WebSocket) em:
`https://chat-fan.onrender.com`

*(Se você hospedar o frontend web também, adicione o link aqui)*

---

## 💡 Possíveis Melhorias Futuras

*   Persistência de dados (mensagens, usuários) usando um banco de dados (ex: PostgreSQL, MongoDB).
*   Autenticação de usuários mais robusta (ex: login com email/senha, OAuth).
*   Indicador de "usuário digitando...".
*   Mais emojis personalizados e um seletor de emojis.
*   Envio de imagens/arquivos.
*   Canais privados ou mensagens diretas.
*   Melhorias na UI/UX e acessibilidade.
*   Testes unitários e de integração.

---

## 👤 Autor

*   **Anderson Lucas Ribeiro de Andrade Lucena**
*   **GitHub:** (https://github.com/andersoncsgo)
*   **LinkedIn:** (https://www.linkedin.com/in/anderson-lucas-lucena/
*   **Email:** anderson.lucas.ribeiro101@gmail.com

---

**GL HF! 😎**