const {
  extrairRespostaFoundry,
  localAnalysis,
  FOUNDRY_API_KEY,
  FOUNDRY_ENDPOINT,
  AGENT_NAME,
  FOUNDRY_HEADERS
} = require('./shared');

exports.handler = async event => {
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({
        error: 'Method not allowed'
      })
    };
  }

  try {
    const { sessionId, message, session } = JSON.parse(event.body);

    if (!sessionId || !session) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'sessionId e session são obrigatórios'
        })
      };
    }

    if (!session.messages) {
      session.messages = [];
    }

    if (!session.complianceState) {
      session.complianceState = {};
    }

    const userMsgId =
      'msg_' + Math.random().toString(36).substring(2, 11);

    session.messages.push({
      id: userMsgId,
      role: 'user',
      content: message,
      timestamp: new Date().toISOString()
    });

    console.log(
      `[Chat] Mensagem recebida na sessão ${sessionId}: "${message}"`
    );

    let replyText = '';
    let isLocal = false;

    console.log(
      `[Chat] FOUNDRY_API_KEY configurada: ${!!FOUNDRY_API_KEY}`
    );

    console.log(
      `[Chat] FOUNDRY_ENDPOINT configurado: ${!!FOUNDRY_ENDPOINT}`
    );

    /*
     * ============================================================
     * 1. CHAMADA AO AGENTE DO AZURE AI FOUNDRY
     * ============================================================
     */

    if (FOUNDRY_API_KEY && FOUNDRY_ENDPOINT) {
      try {
        const endpoint = FOUNDRY_ENDPOINT.replace(/\/$/, '');

        const url = `${endpoint}/openai/v1/responses`;

        const payload = {
          agent_reference: {
            type: 'agent_reference',
            name: AGENT_NAME
          },

          input: [
            {
              role: 'user',
              content: message
            }
          ]
        };

        console.log(
          `[Chat] Enviando requisição para o Foundry: ${url}`
        );

        const response = await fetch(url, {
          method: 'POST',
          headers: FOUNDRY_HEADERS,
          body: JSON.stringify(payload)
        });

        const responseText = await response.text();

        console.log(
          `[Chat] Foundry respondeu com status ${response.status}`
        );

        console.log(
          `[Chat] Resposta do Foundry: ${responseText.substring(0, 1000)}`
        );

        if (!response.ok) {
          throw new Error(
            `Foundry retornou HTTP ${response.status}: ${responseText}`
          );
        }

        const data = JSON.parse(responseText);

        replyText = extrairRespostaFoundry(data);

        if (!replyText || replyText.trim() === '') {
          throw new Error(
            'O Foundry respondeu, mas não foi possível extrair o texto da resposta.'
          );
        }

        console.log(
          `[Chat] Resposta do Foundry extraída: ${replyText.substring(
            0,
            300
          )}`
        );
      } catch (error) {
        console.error(
          `[Chat] Erro ao chamar o Foundry: ${error.message}`
        );

        isLocal = true;

        replyText =
          `Erro ao conectar ao Azure AI Foundry: ${error.message}`;
      }
    } else {
      console.error(
        '[Chat] FOUNDRY_API_KEY ou FOUNDRY_ENDPOINT não configurados.'
      );

      isLocal = true;

      replyText =
        'As variáveis FOUNDRY_API_KEY e FOUNDRY_ENDPOINT não estão configuradas no Netlify.';
    }

    /*
     * ============================================================
     * 2. ADICIONA A RESPOSTA AO HISTÓRICO
     * ============================================================
     */

    const assistantMsgId =
      'msg_' + Math.random().toString(36).substring(2, 11);

    session.messages.push({
      id: assistantMsgId,
      role: 'assistant',
      content: replyText,
      timestamp: new Date().toISOString()
    });

    session.isLocal = isLocal;

    /*
     * ============================================================
     * 3. ANÁLISE LOCAL DE APOIO
     *
     * Nenhum Gemini é utilizado.
     * ============================================================
     */

    const result = localAnalysis(session);

    session.complianceState = result.complianceState;

    session.missingFields = result.missingFields;

    session.parecerTecnico = {
      ...result.parecerTecnico,

      id:
        session.parecerTecnico?.id ||
        'PT-' + Math.floor(1000 + Math.random() * 9000),

      timestamp: new Date().toISOString()
    };

    console.log(
      `[Analysis] Sessão ${sessionId} processada. Progresso: ${session.parecerTecnico.progresso}%`
    );

    /*
     * ============================================================
     * 4. RETORNO AO FRONTEND
     * ============================================================
     */

    return {
      statusCode: 200,

      headers: {
        'Content-Type': 'application/json'
      },

      body: JSON.stringify({
        sessionId,
        isLocal,
        session
      })
    };
  } catch (error) {
    console.error(
      `[Chat] Erro geral: ${error.message}`
    );

    return {
      statusCode: 500,

      body: JSON.stringify({
        error: 'Erro interno do servidor',
        details: error.message
      })
    };
  }
};
