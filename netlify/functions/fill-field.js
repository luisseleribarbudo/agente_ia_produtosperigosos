const {
  getGeminiClient,
  localAnalysis,
  COMPLIANCE_SCHEMA,
  buildRegulatoryRules,
  HAS_GEMINI
} = require('./shared');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: JSON.stringify({ error: 'Method not allowed' }) };
  }

  try {
    const { sessionId, key, value, session } = JSON.parse(event.body);

    if (!sessionId || !session || !key) {
      return { statusCode: 400, body: JSON.stringify({ error: 'sessionId, session e key são obrigatórios' }) };
    }

    // Atualiza o valor diretamente no estado
    session.complianceState[key] = value;

    // Cria uma mensagem do usuário
    const userMsgId = 'msg_direct_' + Math.random().toString(36).substr(2, 9);
    session.messages.push({
      id: userMsgId,
      role: 'user',
      content: `Fornecendo diretamente o valor para ${key}: "${value}"`,
      timestamp: new Date().toISOString()
    });

    // Gera resposta estruturada
    let replyText = '';
    if (HAS_GEMINI) {
      try {
        const client = getGeminiClient();
        const promptHistorico = session.messages.map(m => `${m.role === 'user' ? 'Usuário' : 'Assistente'}: ${m.content}`).join('\n');

        const response = await client.models.generateContent({
          model: 'gemini-2.0-flash',
          contents: `Você é um robô de conformidade técnica especializado em regulação de transporte rodoviário no Brasil (ANTT 5947/21, NBR 7503, NBR 12810, NBR 14619). Seu nome é "transporte-rss-pp".
O usuário acabou de fornecer diretamente o valor para o campo "${key}" como "${value}".
Gere uma resposta de parecer técnico de conformidade contendo este novo dado.

Você DEVE SEMPRE retornar a sua resposta estruturada exatamente utilizando as seguintes seções estruturadas (com títulos em letras maiúsculas):

RESUMO
[Resumo executivo claro e objetivo]

ANÁLISE
[Análise regulatória rica com base na ANTT 5947/21 e nas normas técnicas ABNT]

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
      } catch (error) {
        console.error(`[FillField] Erro ao gerar resposta: ${error.message}`);
        replyText = `Excelente! Registrei que o campo correspondente a **${key}** agora está definido como: "${value}". Deixe-me atualizar o parecer de conformidade e recalcular as exigências regulatórias.`;
      }
    } else {
      replyText = `Campo **${key}** definido como: "${value}". Parecer de conformidade atualizado.`;
    }

    const assistantMsgId = 'msg_direct_confirm_' + Math.random().toString(36).substr(2, 9);
    session.messages.push({
      id: assistantMsgId,
      role: 'assistant',
      content: replyText,
      timestamp: new Date().toISOString()
    });

    // Re-analisa e recalcula
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

Gere uma resposta em JSON contendo o estado de conformidade atualizado, os campos que ainda faltam e o rascunho de parecer técnico completo.`,
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
          console.log(`[FillField] Sessão ${sessionId} reanalisada. Progresso: ${session.parecerTecnico.progresso}%`);
        }
      } catch (error) {
        console.error(`[FillField] Erro ao reanalisar: ${error.message}`);
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
      console.log(`[FillField] Sessão ${sessionId} reanalisada localmente.`);
    }

    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, isLocal: session.isLocal, session })
    };
  } catch (error) {
    console.error(`[FillField] Erro geral: ${error.message}`);
    return { statusCode: 500, body: JSON.stringify({ error: 'Erro interno do servidor' }) };
  }
};
