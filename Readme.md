# 🎫 Support Tickets

Sistema de gestão de tickets de suporte com triagem automática por IA, múltiplos perfis de acesso e SLA configurável.

---

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Pré-requisitos](#pré-requisitos)
- [Instalação do Docker](#instalação-do-docker)
- [Instalação do Make](#instalação-do-make)
- [Como Rodar](#como-rodar)
- [Acesso Inicial](#acesso-inicial)
- [Funcionalidades](#funcionalidades)
- [Comandos Disponíveis](#comandos-disponíveis)

---

## 🧩 Visão Geral

O Support Tickets é uma plataforma completa para abertura e gestão de chamados de suporte. A aplicação conta com três perfis de usuário (admin, operador e usuário), triagem automática de prioridade e categoria via IA (Groq), SLA configurável por prioridade e suporte a três idiomas (Português, Inglês e Espanhol).

**Stack:**
- **Backend:** Node.js + TypeScript + Express + TypeORM + PostgreSQL + Redis + BullMQ
- **Frontend:** React + Vite + TypeScript
- **Auth:** Keycloak (OIDC)
- **IA:** Groq (llama3-70b)
- **Infra:** Docker + Docker Compose

---

## ✅ Pré-requisitos

Antes de começar, você precisa ter instalados:

- **Docker** com Docker Compose V2
- **Make**
- Uma chave de API gratuita do **Groq** — obtenha em [console.groq.com](https://console.groq.com)

---

## 🐳 Instalação do Docker

### Windows

1. Acesse [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
2. Baixe e instale o **Docker Desktop para Windows**
3. Durante a instalação, mantenha a opção **WSL 2** marcada
4. Após instalar, abra o Docker Desktop e aguarde inicializar
5. Verifique no terminal:
   ```powershell
   docker --version
   docker compose version
   ```

### macOS

1. Acesse [https://www.docker.com/products/docker-desktop](https://www.docker.com/products/docker-desktop)
2. Baixe o instalador para **Mac (Intel ou Apple Silicon)**
3. Arraste o Docker para a pasta Aplicativos
4. Abra o Docker Desktop e aguarde inicializar
5. Verifique no terminal:
   ```bash
   docker --version
   docker compose version
   ```

### Linux (Ubuntu/Debian)

```bash
sudo apt-get update
sudo apt-get install -y ca-certificates curl
sudo install -m 0755 -d /etc/apt/keyrings
sudo curl -fsSL https://download.docker.com/linux/ubuntu/gpg -o /etc/apt/keyrings/docker.asc
echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.asc] https://download.docker.com/linux/ubuntu $(. /etc/os-release && echo "$VERSION_CODENAME") stable" | sudo tee /etc/apt/sources.list.d/docker.list
sudo apt-get update
sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
sudo usermod -aG docker $USER
```

Faça logout e login novamente para aplicar o grupo, depois verifique:
```bash
docker --version
docker compose version
```

---

## 🔧 Instalação do Make

### Windows

O Make não vem instalado no Windows por padrão. Instale via **Chocolatey**:

1. Abra o **PowerShell como Administrador**
2. Instale o Chocolatey:
   ```powershell
   Set-ExecutionPolicy Bypass -Scope Process -Force
   [System.Net.ServicePointManager]::SecurityProtocol = [System.Net.ServicePointManager]::SecurityProtocol -bor 3072
   iex ((New-Object System.Net.WebClient).DownloadString('https://community.chocolatey.org/install.ps1'))
   ```
3. Instale o Make:
   ```powershell
   choco install make
   ```
4. Reinicie o PowerShell e verifique:
   ```powershell
   make --version
   ```

> ⚠️ **Importante no Windows:** o `make` precisa ser executado no **PowerShell** ou no **terminal do WSL2**. Se receber erro de permissão, execute o PowerShell como Administrador ou use:
> ```powershell
> Set-ExecutionPolicy RemoteSigned -Scope CurrentUser
> ```

### macOS

O Make já vem instalado no macOS. Se não estiver, instale as ferramentas de linha de comando:

```bash
xcode-select --install
```

Ou via Homebrew:

```bash
brew install make
```

### Linux

```bash
sudo apt-get install -y make
```

---

## 🚀 Como Rodar

### 1. Clone o repositório

```bash
git clone <url-do-repositorio>
cd support-tickets
```

### 2. Configure o backend

```bash
cd backend
cp .env.example .env
```

Abra o arquivo `backend/.env` e preencha as duas chaves de API externas:

```env
GROQ_API_KEY=sua_chave_groq_aqui
ABSTRACT_API_KEY=sua_chave_abstract_aqui
```

- **GROQ_API_KEY** — obtida gratuitamente em [console.groq.com](https://console.groq.com). Usada para triagem automática de prioridade e categoria dos tickets via IA.
- **ABSTRACT_API_KEY** — obtida gratuitamente em [app.abstractapi.com](https://app.abstractapi.com). Usada para enriquecimento de endereço a partir do CEP informado no cadastro.

> As demais variáveis já estão configuradas para desenvolvimento local e não precisam ser alteradas.

### 3. Instale as dependências do frontend

```bash
cd ../frontend
npm install
cd ..
```

> Este passo gera o `package-lock.json` necessário para o build do Docker.

### 4. Suba a aplicação

```bash
make start
```

Na primeira execução, o Docker vai baixar as imagens e construir os containers. Aguarde até ver a mensagem de confirmação. O processo pode levar alguns minutos.

### 5. Acesse

| Serviço | URL |
|---|---|
| Aplicação | http://localhost:3000 |
| API | http://localhost:4000 |
| Keycloak | http://localhost:8080 |

---

## 🔑 Acesso Inicial

### Administrador padrão

O sistema cria automaticamente um usuário administrador na primeira inicialização:

| Campo | Valor |
|---|---|
| **E-mail** | `admin@support.local` |
| **Senha** | `adm@123` |

> Recomenda-se alterar a senha após o primeiro acesso em: http://localhost:8080 → Realm `support-tickets` → Users.

### Criando um usuário comum

Usuários comuns são quem abre os tickets. Para criar um:

1. Acesse http://localhost:3000
2. Clique em **"Não tem cadastro? Crie agora"**
3. Preencha nome, e-mail, CPF (use um CPF válido, ex: `529.982.247-25`), senha e confirme
4. Após criar, clique em **Entrar** e faça login com as credenciais criadas

---

## 👥 Funcionalidades por Perfil

### 👤 Usuário

- Abre novos tickets com título e descrição
- A IA categoriza automaticamente a prioridade e categoria
- Visualiza seus tickets nas abas **Em Aberto** e **Concluídos**
- Vê detalhes completos de cada ticket clicando na linha
- Exclui tickets que ainda estejam com status **aberto**

### 🛠️ Operador

Acesso às mesmas abas do admin, exceto configurações. Para criar um operador, o admin deve acessar **Configurações → Gerenciar Usuários** e criar com perfil **Operador**.

- Visualiza tickets aguardando atendimento (**Aguardando**)
- Visualiza e gerencia tickets **Em Aberto** (open + in_progress)
- Edita status, prioridade e categoria dos tickets atribuídos
- Adiciona comentários explicando o que foi feito ou o motivo de estouro de SLA

### 👑 Administrador

Além de tudo que o operador faz:

- **Gerenciar Usuários** — cria usuários com qualquer perfil (usuário, operador ou admin) diretamente pela plataforma
- **Configurar SLA** — define o tempo de resposta e resolução para cada nível de prioridade (critical, high, medium, low)
- **Excluir** qualquer ticket
- Visualiza histórico detalhado de cada ticket
- Recebe notificações quando operadores alteram prioridades

---

## 🤖 Triagem por IA

Ao abrir um ticket, o sistema envia o título e a descrição para a IA (Groq/llama3-70b), que classifica automaticamente:

- **Prioridade:** critical, high, medium ou low — baseado no impacto descrito
- **Categoria:** hardware, software, network, security, billing, account, technical ou other

O operador pode corrigir a categoria se a IA errar. A prioridade pode ser alterada com justificativa.

---

## ⚙️ Comandos Disponíveis

| Comando | O que faz |
|---|---|
| `make start` | Constrói as imagens e sobe todos os serviços |
| `make stop` | Para os containers sem apagar os dados |
| `make restart` | Para e sobe novamente sem rebuild |
| `make clean` | Remove containers e apaga todos os dados ⚠️ |
| `make logs-api` | Exibe logs da API em tempo real |
| `make logs-worker` | Exibe logs do worker de IA em tempo real |
| `make logs-frontend` | Exibe logs do frontend em tempo real |
| `make status` | Mostra o status de todos os containers |

> ⚠️ `make clean` apaga o banco de dados, volumes e todos os dados. Use apenas para resetar o ambiente completamente.

---

## 🌍 Idiomas

A aplicação suporta **Português** (padrão), **Inglês** e **Espanhol**. O idioma pode ser trocado na tela de login ou no menu superior após autenticado. A preferência é salva no navegador.

---

## 📌 Observações

- O sistema leva alguns segundos após o login para processar a triagem de IA de novos tickets. Se a categoria e prioridade aparecerem como padrão, aguarde e recarregue.
- Se a IA não estiver funcionando, verifique se a `GROQ_API_KEY` no `backend/.env` é válida e se o container foi rebuilado após a alteração.
- Para resetar completamente o ambiente (banco, Keycloak, Redis): `make clean && make start`