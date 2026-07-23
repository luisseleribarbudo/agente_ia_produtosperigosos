# Agente IA - Produtos Perigosos

Assistente técnico de conformidade para transporte de cargas perigosas e resíduos de serviços de saúde (RSS), baseado em IA com Gemini e Azure Foundry.

## Funcionalidades

- Chat com agente IA especializado em regulamentações ANTT 5947/21
- Geração automática de Parecer Técnico de Conformidade
- Templates prontos (Gasolina UN 1203 / Resíduo Hospitalar UN 3291)
- Preenchimento direto de campos regulatórios
- Análise de conformidade com normas ABNT (NBR 7503, NBR 12810, NBR 14619)

## Rodar Localmente

**Pré-requisitos:** Node.js 18+

```bash
# Instalar dependências
npm install

# Configurar variáveis de ambiente
cp .env.example .env
# Edite .env e adicione sua GEMINI_API_KEY

# Iniciar servidor de desenvolvimento
npm run dev
```

Acesse: `http://localhost:3000`

## Deploy no Netlify

1. Conecte o repositório ao [Netlify](https://app.netlify.com)
2. Configure as variáveis de ambiente no painel:
   - `GEMINI_API_KEY` - Chave da API Google Gemini
   - `FOUNDRY_API_KEY` - Chave Azure Foundry (opcional)
   - `FOUNDRY_ENDPOINT` - Endpoint Azure Foundry (opcional)
3. Deploy automático a cada push

## Variáveis de Ambiente

| Variável | Obrigatória | Descrição |
|----------|-------------|-----------|
| `GEMINI_API_KEY` | Sim | Chave da API Google Gemini |
| `FOUNDRY_API_KEY` | Não | Chave da API Azure Foundry |
| `FOUNDRY_ENDPOINT` | Não | Endpoint do Azure Foundry |
| `APP_URL` | Não | URL da aplicação |

## Stack

- **Frontend:** React 19, Vite, Tailwind CSS 4, TypeScript
- **Backend:** Netlify Functions (serverless)
- **IA:** Google Gemini, Azure AI Foundry
- **Regulamentações:** ANTT 5947/21, NBR 7503, NBR 12810, NBR 14619
