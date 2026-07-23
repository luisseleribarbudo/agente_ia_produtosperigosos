const { GoogleGenAI, Type } = require('@google/genai');

const FOUNDRY_API_KEY = process.env.FOUNDRY_API_KEY;
const FOUNDRY_ENDPOINT = process.env.FOUNDRY_ENDPOINT;
const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
const AGENT_NAME = 'transporte-rss-pp';

const HAS_GEMINI = !!GEMINI_API_KEY;

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

function localAnalysis(session) {
  const msgs = session.messages.map(m => m.content.toLowerCase()).join(' ');
  const state = { ...session.complianceState };

  if (msgs.includes('rss') || msgs.includes('resíduo') || msgs.includes('saude') || msgs.includes('saúde') || msgs.includes('infectante') || msgs.includes('hospitalar')) {
    state.cargaTipo = 'RSS';
    state.classeRisco = state.classeRisco || 'Classe 6.2 - Substâncias Infectantes';
    state.codigoOnu = state.codigoOnu || 'UN 3291';
    state.mopp = state.quantidade ? (parseFloat(state.quantidade) > 333 ? 'Sim' : 'Não') : 'Pendente';
    state.cipp = state.quantidade ? (parseFloat(state.quantidade) > 333 ? 'Sim' : 'Não') : 'Pendente';
  } else if (msgs.includes('gasolina') || msgs.includes('combustivel') || msgs.includes('combustível') || msgs.includes('inflamavel') || msgs.includes('inflamável')) {
    state.cargaTipo = 'Produto Perigoso';
    state.classeRisco = state.classeRisco || 'Classe 3 - Líquidos Inflamáveis';
    state.codigoOnu = state.codigoOnu || 'UN 1203';
    state.pontoFulgor = state.pontoFulgor || '< -40°C';
    state.mopp = state.quantidade ? (parseFloat(state.quantidade) > 333 ? 'Sim' : 'Não') : 'Pendente';
    state.cipp = state.quantidade ? (parseFloat(state.quantidade) > 333 ? 'Sim' : 'Não') : 'Pendente';
  }

  for (const f of session.missingFields) {
    if (f.key in state && state[f.key] && state[f.key] !== '' && state[f.key] !== 'Pendente') {
      session.missingFields = session.missingFields.filter(m => m.key !== f.key);
    }
  }

  const filledCount = Object.values(state).filter(v => v && v !== '' && v !== 'Pendente').length;
  const total = Object.keys(state).length;
  const progresso = Math.round((filledCount / total) * 100);

  return {
    complianceState: state,
    missingFields: session.missingFields,
    parecerTecnico: {
      resumo: `Análise local (sem IA). Carga identificada como ${state.cargaTipo || 'Não identificada'}. Código ONU: ${state.codigoOnu || 'Pendente'}.`,
      analise: `Análise baseada em regras locais. ${buildRegulatoryRules()}`,
      pontoFulgor: state.pontoFulgor || 'N/A',
      riscoSubsidiario: state.riscoSubsidiario || 'Nenhum',
      documentacaoConsultada: ['Resolução ANTT nº 5.947/21', 'NBR 7503', 'NBR 12810', 'NBR 14619'],
      documentosNecessarios: [
        { name: 'Manifesto de Transporte de Resíduos (MTR)', checked: false, requiredBy: 'Exigido pelo SINIR para rastreabilidade de resíduos' },
        { name: 'Ficha de Emergência (NBR 7503)', checked: false, requiredBy: 'Exigida para resposta rápida em acidentes' },
        { name: 'Envelope para Transporte (NBR 7503)', checked: false, requiredBy: 'Sinalização e acondicionamento de documentos' }
      ],
      alertasCriticos: progresso < 50 ? ['Campos obrigatórios ainda não preenchidos. Informe tipo de carga, classe de risco e código ONU.'] : [],
      status: progresso >= 80 ? 'Aprovado' : progresso >= 40 ? 'Rascunho' : 'Rascunho',
      progresso
    }
  };
}

module.exports = {
  getGeminiClient,
  extrairRespostaFoundry,
  localAnalysis,
  DEFAULT_COMPLIANCE_STATE,
  COMPLIANCE_SCHEMA,
  buildRegulatoryRules,
  FOUNDRY_API_KEY,
  FOUNDRY_ENDPOINT,
  AGENT_NAME,
  FOUNDRY_HEADERS,
  HAS_GEMINI
};
