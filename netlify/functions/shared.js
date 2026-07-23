const FOUNDRY_API_KEY = process.env.FOUNDRY_API_KEY;
const FOUNDRY_ENDPOINT = process.env.FOUNDRY_ENDPOINT;
const AGENT_NAME = 'transporte-rss-pp';

const FOUNDRY_HEADERS = {
  'Content-Type': 'application/json',
  'api-key': FOUNDRY_API_KEY
};

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

function buildRegulatoryRules() {
  return `Regras regulatórias brasileiras a aplicar na sua análise:

1. Resíduos de Serviços de Saúde (RSS) geralmente pertencem à Classe 6.2 (Substâncias Infectantes) e são classificados em grupos, como Grupo A1, A2, B, entre outros.

2. Para RSS Grupo A1/A2, quando aplicável, o código ONU utilizado é UN 3291. A embalagem deve atender aos requisitos técnicos aplicáveis, incluindo resistência a furos, vazamentos e acondicionamento adequado, conforme normas aplicáveis.

3. O transporte de resíduos de saúde exige atenção à documentação ambiental, incluindo Manifesto de Transporte de Resíduos (MTR), licenças ambientais e demais documentos exigidos pela legislação aplicável.

4. MOPP e CIPP devem ser analisados de acordo com o tipo de carga, quantidade transportada, veículo utilizado e limites de isenção estabelecidos pela regulamentação vigente.

5. Para produtos perigosos de outras classes, como gasolina (UN 1203, Classe 3 - Líquidos Inflamáveis), devem ser avaliados o ponto de fulgor, grupo de embalagem, quantidade transportada e demais requisitos regulamentares.

6. O agente deve sempre informar quando faltarem dados essenciais para uma conclusão segura.

7. O agente não deve inventar informações ausentes. Quando um dado não for informado pelo usuário, deve ser marcado como pendente ou solicitado ao usuário.

A análise deve considerar a regulamentação brasileira aplicável, incluindo a Resolução ANTT nº 5.947/2021 e normas técnicas ABNT pertinentes.`;
}

function localAnalysis(session) {
  const msgs = session.messages
    .map(m => m.content || '')
    .join(' ')
    .toLowerCase();

  const state = {
    ...DEFAULT_COMPLIANCE_STATE,
    ...(session.complianceState || {})
  };

  if (
    msgs.includes('rss') ||
    msgs.includes('resíduo') ||
    msgs.includes('residuo') ||
    msgs.includes('saude') ||
    msgs.includes('saúde') ||
    msgs.includes('infectante') ||
    msgs.includes('hospitalar')
  ) {
    state.cargaTipo = 'RSS';
    state.classeRisco =
      state.classeRisco || 'Classe 6.2 - Substâncias Infectantes';
    state.codigoOnu = state.codigoOnu || 'UN 3291';

    if (state.quantidade) {
      const quantidade = parseFloat(
        String(state.quantidade).replace(',', '.')
      );

      if (!isNaN(quantidade)) {
        state.mopp = quantidade > 333 ? 'Sim' : 'Não';
        state.cipp = quantidade > 333 ? 'Sim' : 'Não';
      }
    }
  } else if (
    msgs.includes('gasolina') ||
    msgs.includes('combustivel') ||
    msgs.includes('combustível') ||
    msgs.includes('inflamavel') ||
    msgs.includes('inflamável')
  ) {
    state.cargaTipo = 'Produto Perigoso';
    state.classeRisco =
      state.classeRisco || 'Classe 3 - Líquidos Inflamáveis';
    state.codigoOnu = state.codigoOnu || 'UN 1203';
    state.pontoFulgor = state.pontoFulgor || '< -40°C';

    if (state.quantidade) {
      const quantidade = parseFloat(
        String(state.quantidade).replace(',', '.')
      );

      if (!isNaN(quantidade)) {
        state.mopp = quantidade > 333 ? 'Sim' : 'Não';
        state.cipp = quantidade > 333 ? 'Sim' : 'Não';
      }
    }
  }

  const missingFields = [];

  const fields = [
    {
      key: 'cargaTipo',
      label: 'Tipo de carga',
      reason: 'Necessário para determinar a regulamentação aplicável.',
      question: 'Qual é o tipo de carga ou resíduo transportado?'
    },
    {
      key: 'classeRisco',
      label: 'Classe de risco',
      reason: 'Necessária para determinar os requisitos de transporte.',
      question: 'Qual é a classe de risco da carga?'
    },
    {
      key: 'codigoOnu',
      label: 'Código ONU',
      reason: 'Necessário para identificar corretamente o produto perigoso.',
      question: 'Qual é o número ONU da carga?'
    },
    {
      key: 'quantidade',
      label: 'Quantidade',
      reason: 'A quantidade pode alterar os requisitos de transporte e isenções.',
      question: 'Qual é a quantidade transportada?'
    },
    {
      key: 'embalagem',
      label: 'Embalagem',
      reason: 'A embalagem precisa ser compatível com a carga transportada.',
      question: 'Qual tipo de embalagem está sendo utilizado?'
    }
  ];

  for (const field of fields) {
    const value = state[field.key];

    if (!value || value === '' || value === 'Pendente') {
      missingFields.push(field);
    }
  }

  const filledCount = Object.values(state).filter(
    value => value && value !== '' && value !== 'Pendente'
  ).length;

  const total = Object.keys(state).length;
  const progresso = Math.round((filledCount / total) * 100);

  return {
    complianceState: state,
    missingFields,
    parecerTecnico: {
      resumo: `Análise local baseada nas informações disponíveis. Carga identificada como ${
        state.cargaTipo || 'Não identificada'
      }. Código ONU: ${state.codigoOnu || 'Pendente'}.`,

      analise: `A análise do agente Foundry não está disponível no momento. Foram aplicadas regras locais básicas. ${buildRegulatoryRules()}`,

      pontoFulgor: state.pontoFulgor || 'N/A',

      riscoSubsidiario: state.riscoSubsidiario || 'Nenhum informado',

      documentacaoConsultada: [
        'Resolução ANTT nº 5.947/2021',
        'NBR 7503',
        'NBR 12810',
        'NBR 14619'
      ],

      documentosNecessarios: [
        {
          name: 'Manifesto de Transporte de Resíduos (MTR)',
          checked: false,
          requiredBy:
            'Documento utilizado para rastreabilidade do transporte de resíduos.'
        },
        {
          name: 'Ficha de Emergência',
          checked: false,
          requiredBy:
            'Documento relacionado às informações de emergência aplicáveis ao transporte.'
        },
        {
          name: 'Envelope para Transporte',
          checked: false,
          requiredBy:
            'Acondicionamento de documentos relacionados ao transporte.'
        }
      ],

      alertasCriticos:
        progresso < 50
          ? [
              'Campos obrigatórios ainda não preenchidos. Informe tipo de carga, classe de risco, código ONU, quantidade e embalagem.'
            ]
          : [],

      status: progresso >= 80 ? 'Aprovado' : 'Rascunho',

      progresso
    }
  };
}

module.exports = {
  extrairRespostaFoundry,
  localAnalysis,
  DEFAULT_COMPLIANCE_STATE,
  buildRegulatoryRules,
  FOUNDRY_API_KEY,
  FOUNDRY_ENDPOINT,
  AGENT_NAME,
  FOUNDRY_HEADERS
};
