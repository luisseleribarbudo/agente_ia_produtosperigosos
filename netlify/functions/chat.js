const {
  getGeminiClient,
  extrairRespostaFoundry,
  localAnalysis,
  COMPLIANCE_SCHEMA,
  buildRegulatoryRules,
  FOUNDRY_API_KEY,
  FOUNDRY_ENDPOINT,
  AGENT_NAME,
  FOUNDRY_HEADERS,
  HAS_GEMINI
} = require('./shared');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { sessionId, message, session } = JSON.parse(event.body);

    if (!sessionId || !session) {
      return { statusCode: 400, body: JSON.stringify({ error: 'sessionId e session são obrigatórios' }) };
    }

    // Adiciona a mensagem do usuário
    const userMsgId = 'msg_' + Math.random().toString(36).substr(2, 9);
    session.messages.push({
      id: userMsgId,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });

    console.log(`[Chat] Mensagem recebida na sessão ${sessionId}: "${message}"`);

    let replyText = '';
    let isLocal = session.isLocal;

    // Passo 1: Obter resposta do agente
    if (!isLocal && FOUNDRY_API_KEY && FOUNDRY_ENDPOINT) {
      try {
        const url = `${FOUNDRY_ENDPOINT}/openai/v1/responses`;
        const payload = {
          'agent_reference': { 'type': 'agent_reference', 'name': AGENT_NAME },
          'conversation': session.id,
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
          console.warn(`[Chat] Foundry retornou erro (${response.status}). Fallback local.`);
          isLocal = true;
        }
      } catch (error) {
        console.error(`[Chat] Erro no Foundry: ${error.message}. Fallback local.`);
        isLocal = true;
      }
    }

    // Se for local, usar Gemini (ou fallback sem IA)
    if (isLocal) {
      if (HAS_GEMINI) {
        try {
          const client = getGeminiClient();
          const promptHistorico = session.messages.map(m => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`).join('\n');

          const response = await client.models.generateContent({
            model: 'gemini-2.0-flash',
            contents: `Você é um robô de conformidade técnica especializado em regulação de transporte rodoviário no Brasil (ANTT 5947/21, NBR 7503, NBR 12810, NBR 14619). Seu nome é "transporte-rss-pp".
Seu dever é analisar as mensagens do usuário sobre a carga técnica (tipo de carga, classe de risco, subgrupo, código ONU, quantidade, embalagem, etc.) e retornar um parecer de conformidade estruturado diretamente na mensagem.

Você DEVE SEMPRE retornar a sua resposta estruturada exatamente utilizando as seguintes seções estruturadas (com títulos em letras maiúsculas):

RESUMO
[Resumo executivo claro e objetivo.]

ANÁLISE
[Análise regulatória rica com base na ANTT 5947/21 e nas normas técnicas ABNT.]

DOCUMENTAÇÃO CONSULTADA
[Lista de normas, resoluções e regulamentos consultados]

ALERTAS
[Lista de alertas importantes de segurança ou requisitos que o embarcador deve observar]

PRÓXIMOS PASSOS
[Diga claramente quais informações adicionais são necessárias para o agente prosseguir]

Aqui está o histórico de conversa atual:
${promptHistorico}

Por favor, gere a próxima resposta apropriada e estruturada do Assistente para o Usuário:`,
          });

          replyText = response.text || 'Entendi, vou processar as informações.';
        } catch (error) {
          console.error(`[Chat] Erro ao gerar resposta com o Gemini: ${error.message}`);
          replyText = 'Desculpe, tive um problema técnico ao processar sua resposta. Poderia repetir, por favor?';
        }
      } else {
        replyText = 'Entendi sua mensagem. Estou processando as informações para gerar o parecer de conformidade.';
      }
    }

    // Adiciona a resposta ao histórico
    const assistantMsgId = 'msg_' + Math.random().toString(36).substr(2, 9);
    session.messages.push({
      id: assistantMsgId,
      role: 'assistant',
      content: replyText,
      timestamp: new Date().toISOString()
    });

    session.isLocal = isLocal;

    // Passo 2: Analisar conformidade
    if (HAS_GEMINI) {
      try {
        const client = getGeminiClient();
        const promptHistoricoCompactado = session.messages.map(m => `${m.role === 'user' ? 'U' : 'A'}: ${m.content}`).join('\n');

        const analysisResponse = await client.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: `Analise a conversa de conformidade técnica brasileira a seguir e extraia as variáveis em um formato estruturado JSON.

Conversa:
${promptHistoricoCompactado}

Valores anteriores do estado de conformidade (para referência, use e atualize se novas informações foram fornecidas):
${JSON.stringify(session.complianceState)}

${buildRegulatoryRules()}

Gere uma resposta em JSON contendo:
1. O estado de conformidade atualizado ("complianceState").
2. Uma lista de campos obrigatórios que ainda estão faltando ou incompletos ("missingFields").
3. O Parecer Técnico atualizado ("parecerTecnico") incluindo resumo, análise, documentação consultada, documentos necessários, alertas críticos, status e progresso.`,
          config: {
            responseMimeType: 'application/json',
            responseSchema: COMPLIANCE_SCHEMA
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
          console.log(`[Analysis] Sessão ${sessionId} analisada. Progresso: ${session.parecerTecnico.progresso}%`);
        }
      } catch (error) {
        console.error(`[Analysis] Erro ao analisar conformidade: ${error.message}`);
      }
    } else {
      const result = localAnalysis(session);
      session.complianceState = result.complianceState;
      session.missingFields = result.missingFields;
      session.parecerTecnico = {
        ...result.parecerTecnico,
        id: session.parecerTecnico?.id || 'PT-' + Math.floor(1000 + Math.random() * 9000),
        timestamp: new Date().toISOString()
      };
      console.log(`[Analysis] Sessão ${sessionId} analisada localmente. Progresso: ${session.parecerTecnico.progresso}%`);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, isLocal, session })
    };
  } catch (error) {
    console.error(`[Chat] Erro geral: ${error.message}`);
    return { statusCode: 500, body: JSON.stringify({ error: 'Erro interno do servidor' }) };
  }
};
