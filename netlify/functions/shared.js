const { GoogleGenAI, Type } = require('@google/genai');

const FOUNDRY_API_KEY = process.env.FOUNDRY_API_KEY;
const FOUNDRY_ENDPOINT = process.env.FOUNDRY_ENDPOINT;
const AGENT_NAME = 'transporte-rss-pp';

const FOUNDRY_HEADERS = {
  'Content-Type': 'application/json',
  'api-key': FOUNDRY_API_KEY
};

let geminiClient = null;

function getGeminiClient() {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY não encontrada no ambiente.");
    }
    geminiClient = new GoogleGenAI({
      apiKey: key || 'MOCK_KEY',
      httpOptions: {
        headers: { 'User-Agent': 'aistudio-build' }
      }
    });
  }
  return geminiClient;
}

function extrairRespostaFoundry(data) {
  if (typeof data.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }
  const chunks = [];
  const output = data.output || [];
  for (const item of output) {
    const content = item.content;
    if (typeof content === 'string') {
      chunks.push(content);
      continue;
    }
    for (const c of (content || [])) {
      if (typeof c.text === 'string') {
        chunks.push(c.text);
      } else if (typeof c.text?.value === 'string') {
        chunks.push(c.text.value);
      } else if (typeof c.content === 'string') {
        chunks.push(c.content);
      }
    }
  }
  return chunks.join('\n').trim() || JSON.stringify(data);
}

const DEFAULT_COMPLIANCE_STATE = {
  cargaTipo: '',
  classeRisco: '',
  grupo: '',
  codigoOnu: '',
  quantidade: '',
  embalagem: '',
  pontoFulgor: '',
  riscoSubsidiario: '',
  mopp: 'Pendente',
  cipp: 'Pendente'
};

const COMPLIANCE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    complianceState: {
      type: Type.OBJECT,
      properties: {
        cargaTipo: { type: Type.STRING, enum: ['RSS', 'Produto Perigoso', ''] },
        classeRisco: { type: Type.STRING },
        grupo: { type: Type.STRING },
        codigoOnu: { type: Type.STRING },
        quantidade: { type: Type.STRING },
        embalagem: { type: Type.STRING },
        pontoFulgor: { type: Type.STRING },
        riscoSubsidiario: { type: Type.STRING },
        mopp: { type: Type.STRING, enum: ['Sim', 'Não', 'Pendente', 'N/A'] },
        cipp: { type: Type.STRING, enum: ['Sim', 'Não', 'Pendente', 'N/A'] }
      }
    },
    missingFields: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          key: { type: Type.STRING },
          label: { type: Type.STRING },
          reason: { type: Type.STRING },
          question: { type: Type.STRING }
        },
        required: ['key', 'label', 'reason', 'question']
      }
    },
    parecerTecnico: {
      type: Type.OBJECT,
      properties: {
        resumo: { type: Type.STRING },
        analise: { type: Type.STRING },
        pontoFulgor: { type: Type.STRING },
        riscoSubsidiario: { type: Type.STRING },
        documentacaoConsultada: { type: Type.ARRAY, items: { type: Type.STRING } },
        documentosNecessarios: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              checked: { type: Type.BOOLEAN },
              requiredBy: { type: Type.STRING }
            },
            required: ['name', 'checked', 'requiredBy']
          }
        },
        alertasCriticos: { type: Type.ARRAY, items: { type: Type.STRING } },
        status: { type: Type.STRING, enum: ['Rascunho', 'Aprovado', 'Rejeitado'] },
        progresso: { type: Type.INTEGER }
      },
      required: ['resumo', 'analise', 'pontoFulgor', 'riscoSubsidiario', 'documentacaoConsultada', 'documentosNecessarios', 'alertasCriticos', 'status', 'progresso']
    }
  },
  required: ['complianceState', 'missingFields', 'parecerTecnico']
};

function buildRegulatoryRules() {
  return `Regras regulatórias brasileiras a aplicar na sua análise:
1. Resíduos de Serviços de Saúde (RSS) geralmente pertencem à Classe 6.2 (Infectantes) e são classificados em Grupos (Ex: Grupo A1, A2, B, etc.).
   - Se for RSS Grupo A1/A2 (Infectante), o código ONU correto é UN 3291. A embalagem deve seguir a NBR 12810 (rígida, resistente a furos e vazamentos).
   - O transporte de resíduos de saúde exige obrigatoriamente MTR (Manifesto de Transporte de Resíduos) e licença ambiental.
   - MOPP (curso de movimentação de produtos perigosos) e CIPP (certificado de inspeção para tanques/veículos) são exigidos se a quantidade de produtos perigosos exceder os limites de isenção da ANTT 5947/21.
2. Se for Produto Perigoso de outra classe (ex: UN 1203 - Gasolina, Classe 3 - Líquidos Inflamáveis):
   - Necessita de Ponto de Fulgor (Gasolina é < -40°C, inflamável).
   - Limite de isenção para inflamáveis (Classe 3, GP II) é 333 kg. Acima disso exige MOPP, CIPP, placas de risco e painel de segurança.
   - Kit de emergência e EPIs específicos são sempre exigidos para transporte de produtos perigosos acima dos limites de isenção.`;
}

module.exports = {
  getGeminiClient,
  extrairRespostaFoundry,
  DEFAULT_COMPLIANCE_STATE,
  COMPLIANCE_SCHEMA,
  buildRegulatoryRules,
  FOUNDRY_API_KEY,
  FOUNDRY_ENDPOINT,
  AGENT_NAME,
  FOUNDRY_HEADERS
};
