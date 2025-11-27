# Guia de Deploy no Vercel

Este guia passo a passo ajudará você a publicar o projeto `calendar-estrategico` no Vercel de forma segura e correta.

## ⚠️ Importante: Configuração do Git

Detectamos que o diretório raiz do seu usuário (`C:\Users\Pablo Prado`) está configurado como um repositório Git. Isso não é recomendado para este projeto. Vamos configurar um repositório Git isolado apenas para esta aplicação.

### Passo 1: Inicializar Git no Projeto

Abra o terminal na pasta do projeto e execute os seguintes comandos:

```bash
# 1. Navegue para a pasta do projeto (se já não estiver nela)
cd "c:\Users\Pablo Prado\OneDrive\Área de Trabalho\ACALENDARIO APP\calendar-estrategico"

# 2. Inicialize um novo repositório Git
git init

# 3. Adicione os arquivos do projeto
git add .

# 4. Faça o primeiro commit
git commit -m "Commit inicial: Configuração do projeto"
```

## Passo 2: Publicar no GitHub

Para fazer o deploy no Vercel, a maneira mais fácil é conectar seu projeto a um repositório no GitHub.

1.  Acesse [github.com/new](https://github.com/new) e crie um novo repositório (ex: `calendar-estrategico`).
2.  **Não** marque as opções de adicionar README, .gitignore ou licença (já temos isso localmente).
3.  Copie o comando para enviar um repositório existente. Será algo parecido com:

```bash
git remote add origin https://github.com/SEU_USUARIO/calendar-estrategico.git
git branch -M main
git push -u origin main
```

4.  Execute esses comandos no seu terminal.

## Passo 3: Deploy no Vercel

1.  Acesse [vercel.com](https://vercel.com) e faça login (pode usar sua conta do GitHub).
2.  Clique em **"Add New..."** -> **"Project"**.
3.  Na lista "Import Git Repository", encontre o repositório `calendar-estrategico` que você acabou de criar e clique em **"Import"**.
4.  **Configurações de Build**:
    *   **Framework Preset**: Vite
    *   **Root Directory**: `./` (padrão)
    *   **Build Command**: `npm run build` (padrão)
    *   **Output Directory**: `dist` (padrão)
    *   **Install Command**: `npm install` (padrão)
5.  Clique em **"Deploy"**.

## Verificação

Após o deploy, o Vercel fornecerá uma URL (ex: `calendar-estrategico.vercel.app`). Acesse essa URL para verificar se a aplicação está funcionando corretamente.

---

**Nota**: Se você encontrar erros de build no Vercel, verifique os logs no dashboard do Vercel e compare com o build local (`npm run build`).
