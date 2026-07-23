/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = 3000;

// Configuração da API do Foundry (Azure OpenAI) - via variáveis de ambiente
const API_KEY = process.env.FOUNDRY_API_KEY || '';
const ENDPOINT = process.env.FOUNDRY_ENDPOINT || '';
const AGENT_NAME = 'transporte-rss-pp';

const FOUNDRY_HEADERS = {
  'Content-Type': 'application/json',
  'api-key': API_KEY
};

// Inicialização Preguiçosa (Lazy) do Gemini para evitar crashes se a chave faltar
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI {
  if (!geminiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (!key) {
      console.warn("GEMINI_API_KEY não encontrada no ambiente. Algumas funções inteligentes usarão mock local.");
    }
    geminiClient = new GoogleGenAI({
      apiKey: key || 'MOCK_KEY',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return geminiClient;
}

// Armazenamento em memória das sessões (Simulação de banco de dados leve)
interface SessionStore {
  id: string;
  isLocal: boolean;
  messages: { id: string; role: 'user' | 'assistant' | 'system'; content: string; timestamp: string }[];
  complianceState: any;
  missingFields: any[];
  parecerTecnico: any | null;
}

const sessions: Record<string, SessionStore> = {};

// Estado de conformidade padrão
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

// Rotas de API do Backend

// 1. Criar uma nova conversa/sessão
app.post('/api/conversations', async (req, res) => {
  const sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
  console.log(`[Session] Criando nova sessão ${sessionId}...`);

  let isLocal = true;
  let foundryConversationId = '';

  try {
    // Tenta se conectar ao Foundry real
    const url = `${ENDPOINT}/openai/v1/conversations`;
    const response = await fetch(url, {
      method: 'POST',
      headers: FOUNDRY_HEADERS,
      body: JSON.stringify({})
    });

    if (response.ok) {
      const data = await response.json() as any;
      foundryConversationId = data.id;
      isLocal = false;
      console.log(`[Session] Foundry remoto conectado! ID: ${foundryConversationId}`);
    } else {
      console.warn(`[Session] Resposta do Foundry remoto não-OK (${response.status}). Usando fallback local.`);
    }
  } catch (error: any) {
    console.error(`[Session] Erro ao conectar ao Foundry remoto: ${error.message}. Usando fallback local.`);
  }

  // Registra a sessão
  sessions[sessionId] = {
    id: isLocal ? sessionId : foundryConversationId,
    isLocal,
    messages: [
      {
        id: 'msg_init',
        role: 'assistant',
        content: 'Olá! Sou o assistente técnico de conformidade para transporte de cargas perigosas e resíduos de serviços de saúde (RSS). Para iniciarmos a elaboração do Parecer Técnico de Conformidade, por favor, me informe: qual é o tipo de carga que você deseja transportar (ex: Resíduo de Serviço de Saúde ou algum outro Produto Perigoso específico)?',
        timestamp: new Date().toISOString()
      }
    ],
    complianceState: { ...DEFAULT_COMPLIANCE_STATE },
    missingFields: [
      { key: 'cargaTipo', label: 'Tipo de Carga', reason: 'Necessário para determinar as regras específicas do regulamento ANTT 5947/21.', question: 'Qual é o tipo de carga (Resíduo de Serviço de Saúde ou Produto Perigoso)?' },
      { key: 'classeRisco', label: 'Classe de Risco', reason: 'Determina a classificação de perigo do material.', question: 'Qual é a classe de risco do material?' },
      { key: 'codigoOnu', label: 'Código ONU', reason: 'Código de identificação internacional exigido por lei.', question: 'Qual é o número ONU da carga?' },
      { key: 'quantidade', label: 'Quantidade', reason: 'Necessário para verificar isenções por quantidade limitada.', question: 'Qual é a quantidade total a ser transportada?' },
      { key: 'embalagem', label: 'Embalagem', reason: 'Garante a contenção segura contra vazamentos e contaminações.', question: 'Como o material está embalado?' }
    ],
    parecerTecnico: {
      id: 'PT-' + Math.floor(1000 + Math.random() * 9000),
      timestamp: new Date().toISOString(),
      resumo: 'Aguardando informações iniciais do usuário para iniciar a triagem regulatória.',
      analise: 'Nenhuma informação técnica fornecida ainda.',
      pontoFulgor: 'Pendente',
      riscoSubsidiario: 'Pendente',
      documentacaoConsultada: ['Resolução ANTT nº 5.947/21', 'NBR 14619: Compatibilidade de Cargas'],
      documentosNecessarios: [
        { name: 'Manifesto de Transporte de Resíduos (MTR)', checked: false, requiredBy: 'Exigido pelo SINIR para rastreabilidade de resíduos' },
        { name: 'Ficha de Emergência (NBR 7503)', checked: false, requiredBy: 'Exigida para resposta rápida em acidentes' },
        { name: 'Envelope para Transporte (NBR 7503)', checked: false, requiredBy: 'Sinalização e acondicionamento de documentos' }
      ],
      alertasCriticos: [],
      status: 'Rascunho',
      progresso: 10
    }
  };

  res.json({
    sessionId,
    isLocal,
    session: sessions[sessionId]
  });
});

// Helper para extrair texto da resposta bruta do Foundry
function extrairRespostaFoundry(data: any): string {
  if (typeof data.output_text === 'string' && data.output_text.trim()) {
    return data.output_text.trim();
  }

  const chunks: string[] = [];
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

// 2. Enviar mensagem e atualizar análise de conformidade
app.post('/api/chat', async (req, res) => {
  const { sessionId, message } = req.body;

  if (!sessionId || !sessions[sessionId]) {
    return res.status(404).json({ error: 'Sessão não encontrada' });
  }

  const session = sessions[sessionId];

  // Adiciona a pergunta do usuário
  const userMsgId = 'msg_' + Math.random().toString(36).substr(2, 9);
  session.messages.push({
    id: userMsgId,
    role: 'user',
    content: message,
    timestamp: new Date().toISOString()
  });

  console.log(`[Chat] Mensagem recebida na sessão ${sessionId}: "${message}"`);

  let replyText = '';

  // Passo 1: Obter a resposta do agente (remoto ou local via Gemini)
  if (!session.isLocal) {
    try {
      const url = `${ENDPOINT}/openai/v1/responses`;
      const payload = {
        'agent_reference': {
          'type': 'agent_reference',
          'name': AGENT_NAME
        },
        'conversation': session.id, // foundry id
        'input': [{ 'role': 'user', 'content': message }]
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: FOUNDRY_HEADERS,
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        const data = await response.json();
        replyText = extrairRespostaFoundry(data);
        console.log(`[Chat] Resposta recebida do Foundry remoto.`);
      } else {
        console.warn(`[Chat] Foundry remoto retornou erro (${response.status}). Ativando fallback local temporário.`);
        session.isLocal = true; // Muda para local temporariamente
      }
    } catch (error: any) {
      console.error(`[Chat] Erro na requisição ao Foundry remoto: ${error.message}. Ativando fallback local.`);
      session.isLocal = true;
    }
  }

  // Se for local (ou se o remoto falhou), geramos a resposta usando o Gemini
  if (session.isLocal) {
    try {
      const client = getGeminiClient();
      const promptHistorico = session.messages.map(m => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`).join('\n');

      const response = await client.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: `Você é um robô de conformidade técnica especializado em regulação de transporte rodoviário no Brasil (ANTT 5947/21, NBR 7503, NBR 12810, NBR 14619). Seu nome é "transporte-rss-pp".
Seu dever é analisar as mensagens do usuário sobre a carga técnica (tipo de carga, classe de risco, subgrupo, código ONU, quantidade, embalagem, etc.) e retornar um parecer de conformidade estruturado diretamente na mensagem.

Você DEVE SEMPRE retornar a sua resposta estruturada exatamente utilizando as seguintes seções estruturadas (com títulos em letras maiúsculas):

RESUMO
[Resumo executivo claro e objetivo. Se o material for do Subgrupo A2 de RSS, explique claramente que a placa de transporte rodoviário depende da classificação oficial do material e que não se deve escolher a placa apenas por ser Grupo A2. Destaque as possibilidades documentais localizadas, por exemplo: ONU 2900 (Substância infectante que afeta apenas animais) - Classe 6.2 ou ONU 3549 (Resíduos médicos, Categoria A, que afeta apenas animais, sólido) - Classe 6.2]

ANÁLISE
[Análise regulatória rica com base na ANTT 5947/21 e nas normas técnicas ABNT. Por exemplo, explique o que corresponde a cada código ONU se classificado como tal (Número ONU, Classe de Risco, Rótulo de Risco, Grupo de Embalagem, etc.)]

DOCUMENTAÇÃO CONSULTADA
[Lista de normas, resoluções e regulamentos consultados]

ALERTAS
[Lista de alertas importantes de segurança ou requisitos que o embarcador deve observar]

PRÓXIMOS PASSOS
[Diga claramente quais informações adicionais são necessárias para o agente prosseguir ou os próximos passos recomendados]

Aqui está o histórico de conversa atual:
${promptHistorico}

Por favor, gere a próxima resposta apropriada e estruturada do Assistente para o Usuário:`,
      });

      replyText = response.text || 'Entendi, vou processar as informações.';
    } catch (error: any) {
      console.error(`[Chat] Erro ao gerar resposta com o Gemini: ${error.message}`);
      replyText = 'Desculpe, tive um problema técnico ao processar sua resposta. Poderia repetir, por favor?';
    }
  }

  // Adiciona a resposta do agente ao histórico de mensagens
  const assistantMsgId = 'msg_' + Math.random().toString(36).substr(2, 9);
  session.messages.push({
    id: assistantMsgId,
    role: 'assistant',
    content: replyText,
    timestamp: new Date().toISOString()
  });

  // Passo 2: Analisar a conformidade e atualizar o Parecer Técnico usando o Gemini estruturado
  try {
    const client = getGeminiClient();
    const promptHistoricoCompactado = session.messages.map(m => `${m.role === 'user' ? 'U' : 'A'}: ${m.content}`).join('\n');

    const analysisResponse = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Analise a conversa de conformidade técnica brasileira a seguir e extraia as variáveis em um formato estruturado JSON.

Conversa:
${promptHistoricoCompactado}

Valores anteriores do estado de conformidade (para referência, use e atualize se novas informações foram fornecidas):
${JSON.stringify(session.complianceState)}

Regras regulatórias brasileiras a aplicar na sua análise:
1. Resíduos de Serviços de Saúde (RSS) geralmente pertencem à Classe 6.2 (Infectantes) e são classificados em Grupos (Ex: Grupo A1, A2, B, etc.).
   - Se for RSS Grupo A1/A2 (Infectante), o código ONU correto é UN 3291. A embalagem deve seguir a NBR 12810 (rígida, resistente a furos e vazamentos).
   - O transporte de resíduos de saúde exige obrigatoriamente MTR (Manifesto de Transporte de Resíduos) e licença ambiental.
   - MOPP (curso de movimentação de produtos perigosos) e CIPP (certificado de inspeção para tanques/veículos) são exigidos se a quantidade de produtos perigosos exceder os limites de isenção da ANTT 5947/21 (ex: para classe 6.2 categoria de transporte 2, o limite de isenção é de 333 kg/L. Acima disso, MOPP e CIPP são obrigatórios. Para UN 3291, o limite geral de isenção sem MOPP é de 333 kg).
2. Se for Produto Perigoso de outra classe (ex: UN 1203 - Gasolina, Classe 3 - Líquidos Inflamáveis):
   - Necessita de Ponto de Fulgor (Gasolina é < -40°C, inflamável).
   - Limite de isenção para inflamáveis (Classe 3, GP II) é 333 kg. Acima disso exige MOPP, CIPP, placas de risco e painel de segurança.
   - Kit de emergência e EPIs específicos são sempre exigidos para transporte de produtos perigosos acima dos limites de isenção.

Gere uma resposta em JSON contendo:
1. O estado de conformidade atualizado ("complianceState").
2. Uma lista de campos obrigatórios que ainda estão faltando ou incompletos ("missingFields"). Cada item deve ter:
   - "key": o nome do campo no complianceState.
   - "label": nome amigável (Ex: "Código ONU").
   - "reason": explicação curta por que é necessário legalmente.
   - "question": pergunta curta estruturada que o site pode exibir em um botão ou formulário de resposta rápida.
3. O Parecer Técnico atualizado ("parecerTecnico") incluindo:
   - "resumo": resumo técnico em português sobre a situação atual da carga e isenções de forma muito clara.
   - "analise": análise baseada nas NBRs e ANTT 5947/21 aplicáveis.
   - "pontoFulgor": "N/A" se for RSS Classe 6.2, ou a especificação se for inflamável.
   - "riscoSubsidiario": se houver (ex: corrosivo, tóxico) ou "Nenhum".
   - "documentacaoConsultada": lista de resoluções e normas consultadas (ex: Resolução ANTT 5947, NBR 7503, NBR 14619).
   - "documentosNecessarios": array de objetos com "name" (nome do documento), "checked" (booleano indicando se já temos dados ou se é exigido e podemos marcar como pendente/obrigatório) e "requiredBy" (norma/motivo legal).
   - "alertasCriticos": lista de alertas importantes baseados em regras brasileiras (ex: proibição de empilhamento de sacos de RSS, necessidade de EPI, etc.).
   - "status": "Rascunho" se faltar dados obrigatórios, "Aprovado" se estiver tudo conforme, ou "Rejeitado" se houver alguma não-conformidade insolúvel (como embalagem inadequada).
   - "progresso": número de 0 a 100 indicando a completude dos dados da consulta.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
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
                documentacaoConsultada: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
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
                alertasCriticos: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                status: { type: Type.STRING, enum: ['Rascunho', 'Aprovado', 'Rejeitado'] },
                progresso: { type: Type.INTEGER }
              },
              required: ['resumo', 'analise', 'pontoFulgor', 'riscoSubsidiario', 'documentacaoConsultada', 'documentosNecessarios', 'alertasCriticos', 'status', 'progresso']
            }
          },
          required: ['complianceState', 'missingFields', 'parecerTecnico']
        }
      }
    });

    if (analysisResponse.text) {
      const parsed = JSON.parse(analysisResponse.text.trim());
      session.complianceState = parsed.complianceState;
      session.missingFields = parsed.missingFields;
      session.parecerTecnico = {
        ...parsed.parecerTecnico,
        id: session.parecerTecnico?.id || 'PT-' + Math.floor(1000 + Math.random() * 9000),
        timestamp: new Date().toISOString()
      };
      console.log(`[Analysis] Sessão ${sessionId} analisada e atualizada com sucesso. Progresso: ${session.parecerTecnico.progresso}%`);
    }
  } catch (error: any) {
    console.error(`[Analysis] Erro ao analisar a conformidade com o Gemini: ${error.message}`);
    // Mantém o estado atual sem estourar erro
  }

  res.json({
    sessionId,
    isLocal: session.isLocal,
    session
  });
});

// 3. Fornecer dados estruturados de forma direta (atalho de preenchimento)
app.post('/api/fill-field', async (req, res) => {
  const { sessionId, key, value } = req.body;

  if (!sessionId || !sessions[sessionId]) {
    return res.status(404).json({ error: 'Sessão não encontrada' });
  }

  const session = sessions[sessionId];
  
  // Atualiza o valor diretamente no estado
  session.complianceState[key] = value;
  
  // Cria uma mensagem do usuário indicando a ação direta
  const userMsgId = 'msg_direct_' + Math.random().toString(36).substr(2, 9);
  session.messages.push({
    id: userMsgId,
    role: 'user',
    content: `Fornecendo diretamente o valor para ${key}: "${value}"`,
    timestamp: new Date().toISOString()
  });

  // Gera a resposta estruturada usando o Gemini de forma dinâmica!
  let replyText = '';
  try {
    const client = getGeminiClient();
    const promptHistorico = session.messages.map(m => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`).join('\n');

    const response = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Você é um robô de conformidade técnica especializado em regulação de transporte rodoviário no Brasil (ANTT 5947/21, NBR 7503, NBR 12810, NBR 14619). Seu nome é "transporte-rss-pp".
O usuário acabou de fornecer diretamente o valor para o campo "${key}" como "${value}".
Gere uma resposta de parecer técnico de conformidade contendo este novo dado.

Você DEVE SEMPRE retornar a sua resposta estruturada exatamente utilizando as seguintes seções estruturadas (com títulos em letras maiúsculas):

RESUMO
[Resumo executivo claro e objetivo. Se o material for do Subgrupo A2 de RSS, explique claramente que a placa de transporte rodoviário depende da classificação oficial do material e que não se deve escolher a placa apenas por ser Grupo A2. Destaque as possibilidades documentais localizadas, por exemplo: ONU 2900 (Substância infectante que afeta apenas animais) - Classe 6.2 ou ONU 3549 (Resíduos médicos, Categoria A, que afeta apenas animais, sólido) - Classe 6.2]

ANÁLISE
[Análise regulatória rica com base na ANTT 5947/21 e nas normas técnicas ABNT. Por exemplo, explique o que corresponde a cada código ONU se classificado como tal (Número ONU, Classe de Risco, Rótulo de Risco, Grupo de Embalagem, etc.)]

DOCUMENTAÇÃO CONSULTADA
[Lista de normas, resoluções e regulamentos consultados]

ALERTAS
[Lista de alertas importantes de segurança ou requisitos regulatórios]

PRÓXIMOS PASSOS
[Diga claramente quais informações ou próximos passos restam]

Histórico da conversa atual:
${promptHistorico}

Por favor, gere a resposta estruturada contendo o dado atualizado:`,
    });

    replyText = response.text || `Perfeito! Registrei que o campo correspondente a **${key}** agora está definido como: "${value}".`;
  } catch (error: any) {
    console.error(`[FillField] Erro ao gerar resposta com o Gemini: ${error.message}`);
    replyText = `Excelente! Registrei que o campo correspondente a **${key}** agora está definido como: "${value}". Deixe-me atualizar o parecer de conformidade e recalcular as exigências regulatórias.`;
  }

  const assistantMsgId = 'msg_direct_confirm_' + Math.random().toString(36).substr(2, 9);
  session.messages.push({
    id: assistantMsgId,
    role: 'assistant',
    content: replyText,
    timestamp: new Date().toISOString()
  });

  // Re-analisa e recalcula
  try {
    const client = getGeminiClient();
    const promptHistoricoCompactado = session.messages.map(m => `${m.role === 'user' ? 'U' : 'A'}: ${m.content}`).join('\n');

    const analysisResponse = await client.models.generateContent({
      model: 'gemini-3.5-flash',
      contents: `Analise a conversa de conformidade técnica brasileira a seguir e extraia as variáveis em um formato estruturado JSON.

Conversa:
${promptHistoricoCompactado}

Valores anteriores do estado de conformidade (para referência, use e atualize se novas informações foram fornecidas):
${JSON.stringify(session.complianceState)}

Regras regulatórias brasileiras a aplicar na sua análise:
1. Resíduos de Serviços de Saúde (RSS) pertencem à Classe 6.2 (Infectantes) e são classificados em Grupos (Ex: Grupo A1, A2, B, etc.).
   - Se for RSS Grupo A1 (Infectante), o código ONU correto é UN 3291. A embalagem deve seguir a NBR 12810 (rígida, resistente a furos e vazamentos).
   - O transporte de resíduos de saúde exige obrigatoriamente MTR (Manifesto de Transporte de Resíduos) e licença ambiental.
   - MOPP (curso de movimentação de produtos perigosos) e CIPP (certificado de inspeção para tanques/veículos) são exigidos se a quantidade de produtos perigosos exceder os limites de isenção da ANTT 5947/21 (limite para Classe 6.2 é de 333 kg).
2. Se for Produto Perigoso de outra classe (ex: UN 1203 - Gasolina, Classe 3 - Líquidos Inflamáveis):
   - Necessita de Ponto de Fulgor (Gasolina é < -40°C, inflamável).
   - Limite de isenção para inflamáveis (Classe 3, GP II) é 333 kg. Acima disso exige MOPP, CIPP, placas de risco e painel de segurança.
   - Kit de emergência e EPIs específicos são sempre exigidos para transporte de produtos perigosos acima dos limites de isenção.

Gere uma resposta em JSON contendo o estado de conformidade atualizado, os campos que ainda faltam e o rascunho de parecer técnico completo.`,
      config: {
        responseMimeType: 'application/json',
        responseSchema: {
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
                documentacaoConsultada: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
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
                alertasCriticos: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING }
                },
                status: { type: Type.STRING, enum: ['Rascunho', 'Aprovado', 'Rejeitado'] },
                progresso: { type: Type.INTEGER }
              },
              required: ['resumo', 'analise', 'pontoFulgor', 'riscoSubsidiario', 'documentacaoConsultada', 'documentosNecessarios', 'alertasCriticos', 'status', 'progresso']
            }
          },
          required: ['complianceState', 'missingFields', 'parecerTecnico']
        }
      }
    });

    if (analysisResponse.text) {
      const parsed = JSON.parse(analysisResponse.text.trim());
      session.complianceState = parsed.complianceState;
      session.missingFields = parsed.missingFields;
      session.parecerTecnico = {
        ...parsed.parecerTecnico,
        id: session.parecerTecnico?.id || 'PT-' + Math.floor(1000 + Math.random() * 9000),
        timestamp: new Date().toISOString()
      };
      console.log(`[FillField] Sessão ${sessionId} reanalisada de forma direta. Progresso: ${session.parecerTecnico.progresso}%`);
    }
  } catch (error: any) {
    console.error(`[FillField] Erro ao analisar conformidade direta: ${error.message}`);
  }

  res.json({
    sessionId,
    isLocal: session.isLocal,
    session
  });
});

// Configuração do Vite Middleware em Desenvolvimento e Estáticos em Produção
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Servidor rodando na porta ${PORT} (http://localhost:${PORT})`);
  });
}

startServer();
