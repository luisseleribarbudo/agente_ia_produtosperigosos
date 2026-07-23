const {
  DEFAULT_COMPLIANCE_STATE,
  FOUNDRY_API_KEY,
  FOUNDRY_ENDPOINT,
  AGENT_NAME,
  FOUNDRY_HEADERS
} = require('./shared');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  const sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
  console.log(`[Session] Criando nova sessão ${sessionId}...`);
  console.log(`[Session] FOUNDRY_API_KEY configurada: ${!!FOUNDRY_API_KEY}`);
  console.log(`[Session] FOUNDRY_ENDPOINT configurado: ${!!FOUNDRY_ENDPOINT}`);

  let isLocal = true;
  let foundryConversationId = '';

  if (FOUNDRY_API_KEY && FOUNDRY_ENDPOINT) {
    try {
      const url = `${FOUNDRY_ENDPOINT}/openai/v1/conversations`;
      console.log(`[Session] Conectando ao Foundry: ${url}`);
      const response = await fetch(url, {
        method: 'POST',
        headers: FOUNDRY_HEADERS,
        body: JSON.stringify({})
      });

      const responseText = await response.text();
      console.log(`[Session] Foundry respondeu com status ${response.status}: ${responseText.substring(0, 500)}`);

      if (response.ok) {
        const data = JSON.parse(responseText);
        foundryConversationId = data.id;
        isLocal = false;
        console.log(`[Session] Foundry remoto conectado! ID: ${foundryConversationId}`);
      } else {
        console.warn(`[Session] Foundry retornou erro ${response.status}. Usando fallback local.`);
      }
    } catch (error) {
      console.error(`[Session] Erro ao conectar ao Foundry: ${error.message}. Usando fallback local.`);
    }
  } else {
    console.warn(`[Session] Variáveis FOUNDRY não configuradas. Modo local.`);
  }

  const session = {
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

  return {
    statusCode: 200,
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sessionId, isLocal, session })
  };
};
