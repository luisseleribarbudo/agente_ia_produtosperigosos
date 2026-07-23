/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface LegislationItem {
  id: string;
  title: string;
  code: string;
  scope: string;
  description: string;
  details: string[];
  keyArticles: { article: string; text: string }[];
}

export interface HazmatClassItem {
  id: string;
  classNumber: string;
  name: string;
  color: string;
  textColor: string;
  description: string;
  subClasses: string[];
  handlingPrecautions: string[];
  packagingRequirements: string;
}

export const LEGISLATION_DATABASE: LegislationItem[] = [
  {
    id: 'antt-5947',
    title: 'Instruções Complementares ao Transporte de Produtos Perigosos',
    code: 'Resolução ANTT nº 5.947/21',
    scope: 'Federal / Rodoviário',
    description: 'Regulamenta as diretrizes nacionais para o transporte rodoviário seguro de cargas perigosas e resíduos, estabelecendo as tabelas de classificação, isenções por quantidade, penalidades e deveres.',
    details: [
      'Define limites de isenção de sinalização e MOPP com base no código ONU.',
      'Exige que todo transporte acima do limite de isenção possua placas de risco e painéis de segurança instalados.',
      'Estabelece o uso obrigatório do Kit de Emergência (NBR 9735).'
    ],
    keyArticles: [
      { article: 'Art. 4º', text: 'Os produtos perigosos somente podem ser oferecidos para transporte se estiverem devidamente classificados, embalados, marcados, rotulados e documentados.' },
      { article: 'Anexo I - Isenção', text: 'Limita a obrigatoriedade de habilitar o condutor com MOPP e portar CIPP se o peso bruto total de UN 3291 não exceder 333 kg na unidade de transporte.' }
    ]
  },
  {
    id: 'nbr-12810',
    title: 'Coleta de Resíduos de Serviços de Saúde - Requisitos de Embalagem',
    code: 'ABNT NBR 12810-1',
    scope: 'Técnico / Embalagem',
    description: 'Especifica as condições de fabricação e desempenho de coletores de resíduos de serviços de saúde, garantindo isolamento total do agente patogênico e prevenção de vazamentos.',
    details: [
      'Exige recipientes rígidos para materiais perfurocortantes (Grupo E).',
      'Determina o uso de sacos plásticos vermelhos espessos (NBR 9191) para resíduos biológicos do Grupo A.',
      'Proíbe terminantemente o reaproveitamento ou lavagem de coletores descartáveis.'
    ],
    keyArticles: [
      { article: 'Seção 4.1', text: 'Os recipientes devem ser estanques, resistentes à punctura, ruptura, impacto e vazamentos, providos de tampa de vedação hermética.' },
      { article: 'Seção 5.2', text: 'O preenchimento dos recipientes de descarte perfurocortante não deve exceder o limite de 2/3 da capacidade total indicada pelo fabricante.' }
    ]
  },
  {
    id: 'nbr-7503',
    title: 'Ficha de Emergência e Envelope para Transporte Rodoviário',
    code: 'ABNT NBR 7503',
    scope: 'Técnico / Documentação',
    description: 'Especifica o formato e as informações obrigatórias para preenchimento da Ficha de Emergência e do Envelope para transporte de produtos perigosos, essenciais para atendimento a acidentes.',
    details: [
      'Ficha de Emergência deve conter o telefone do fabricante e de órgãos de resposta (Ex: PRF, Corpo de Bombeiros).',
      'Devem ser preenchidos de forma legível e sem rasuras, em português.',
      'O envelope deve acomodar os documentos de porte obrigatório (MTR, nota fiscal, licenças).'
    ],
    keyArticles: [
      { article: 'Seção 3.2', text: 'A Ficha de Emergência deve estar disposta na cabine do veículo de forma que o condutor possa alcançá-la imediatamente em caso de sinistro.' },
      { article: 'Seção 4.1', text: 'O Envelope de Transporte deve possuir alta visibilidade e conter externamente o número ONU e a classe de risco do material transportado.' }
    ]
  },
  {
    id: 'rdc-222',
    title: 'Gerenciamento de Resíduos de Serviços de Saúde',
    code: 'Anvisa RDC nº 222/18',
    scope: 'Sanitário / Gerenciamento',
    description: 'Regulamenta as Boas Práticas de Gerenciamento de Resíduos de Serviços de Saúde, desde a geração (segregação) até o descarte final, focando na biossegurança.',
    details: [
      'Classifica os resíduos em Grupos (A: Biológicos, B: Químicos, C: Rejeitos Radioativos, D: Comuns, E: Perfurocortantes).',
      'Exige a elaboração do PGRSS (Plano de Gerenciamento de Resíduos de Serviços de Saúde).',
      'Determina a obrigatoriedade de rastrear resíduos usando o MTR estadual/nacional.'
    ],
    keyArticles: [
      { article: 'Art. 6º', text: 'O gerador de resíduos de serviços de saúde é o responsável pelo gerenciamento de seus resíduos até a destinação final licenciada.' },
      { article: 'Art. 43º', text: 'O transporte externo de resíduos do Grupo A deve ser feito em veículos licenciados e compartimento de carga estanque e lavável.' }
    ]
  },
  {
    id: 'nbr-14619',
    title: 'Incompatibilidade Química no Transporte Conjunto',
    code: 'ABNT NBR 14619',
    scope: 'Técnico / Compatibilidade',
    description: 'Estabelece critérios de compatibilidade e segregação química para evitar o transporte conjunto de substâncias que possam reagir entre si de forma perigosa.',
    details: [
      'Proíbe o transporte conjunto de Substâncias Infectantes (Classe 6.2) com alimentos ou rações para animais.',
      'Regula o transporte de Líquidos Inflamáveis (Classe 3) junto com substâncias comburentes (Classe 5.1).',
      'Exige o cumprimento da matriz de incompatibilidade para consolidar cargas fracionadas.'
    ],
    keyArticles: [
      { article: 'Tabela 1', text: 'É estritamente vedado carregar na mesma unidade de transporte substâncias da Classe 6.2 com produtos alimentícios ou recipientes vazios destinados ao consumo humano.' },
      { article: 'Seção 4.3', text: 'Reações químicas incompatíveis incluem a liberação de gases inflamáveis, fumaça tóxica, geração excessiva de calor, incêndio ou explosão.' }
    ]
  }
];

export const HAZMAT_CLASSES: HazmatClassItem[] = [
  {
    id: 'class-1',
    classNumber: '1',
    name: 'Explosivos',
    color: '#D32F2F',
    textColor: '#FFFFFF',
    description: 'Substâncias ou artigos que contêm substâncias explosivas que podem produzir reações químicas com desprendimento de gases a temperaturas e pressões altas, causando estragos.',
    subClasses: ['1.1 Explosão em massa', '1.2 Projeção', '1.3 Incêndio', '1.4 Pequeno perigo'],
    handlingPrecautions: [
      'Evitar fontes de ignição, faíscas ou calor.',
      'Não arrastar embalagens.',
      'Sinalizar imediatamente no entorno da cabine com placas dedicadas.'
    ],
    packagingRequirements: 'Embalagens certificadas pelo Exército com amortecimento interno de alta absorção de choque.'
  },
  {
    id: 'class-2',
    classNumber: '2',
    name: 'Gases',
    color: '#388E3C',
    textColor: '#FFFFFF',
    description: 'Gases comprimidos, liquefeitos, dissolvidos sob pressão ou criogênicos que apresentem riscos de asfixia, toxicidade ou inflamabilidade extrema.',
    subClasses: ['2.1 Gases Inflamáveis', '2.2 Gases Não-Inflamáveis e Não-Tóxicos', '2.3 Gases Tóxicos'],
    handlingPrecautions: [
      'Manter cilindros sempre na vertical.',
      'Assegurar ventilação contínua no compartimento de carga.',
      'Proteger válvulas contra impactos diretos.'
    ],
    packagingRequirements: 'Cilindros de aço sem costura testados hidrostaticamente e válvulas com capuz protetor.'
  },
  {
    id: 'class-3',
    classNumber: '3',
    name: 'Líquidos Inflamáveis',
    color: '#E64A19',
    textColor: '#FFFFFF',
    description: 'Líquidos, misturas de líquidos ou líquidos contendo sólidos em solução que produzem vapores inflamáveis a temperaturas baixas (Ponto de Fulgor inferior ou igual a 60°C). Exemplo típico: UN 1203 - Gasolina.',
    subClasses: ['Grupo I: PF < 23°C (Altamente Inflamável)', 'Grupo II: PF < 23°C e Ebulição > 35°C', 'Grupo III: PF 23°C a 60°C'],
    handlingPrecautions: [
      'Aterramento elétrico obrigatório nas operações de carga e descarga.',
      'Garantir isolamento de qualquer chama, fiação exposta ou faíscas.',
      'Portar extintores pressurizados de pó químico e CO2 na área de fácil acesso.'
    ],
    packagingRequirements: 'Tambores metálicos herméticos, bombonas homologadas ou tanques criados sob especificação do Inmetro.'
  },
  {
    id: 'class-4',
    classNumber: '4',
    name: 'Sólidos Inflamáveis',
    color: '#FF5722',
    textColor: '#FFFFFF',
    description: 'Substâncias sujeitas a combustão espontânea ou que, em contato com a água, emitem gases inflamáveis ou calor extremo.',
    subClasses: ['4.1 Sólidos Inflamáveis', '4.2 Combustão Espontânea', '4.3 Perigosos em contato com água'],
    handlingPrecautions: [
      'Manter em temperatura controlada.',
      'Evitar contato com umidade ou infiltrações de água na carroceria.',
      'Armazenar em ambiente seco.'
    ],
    packagingRequirements: 'Embalagens impermeáveis de alta resistência à umidade e calor solar.'
  },
  {
    id: 'class-5',
    classNumber: '5',
    name: 'Substâncias Oxidantes',
    color: '#FBC02D',
    textColor: '#000000',
    description: 'Substâncias que, embora não necessariamente combustíveis, podem liberar oxigênio facilmente e provocar ou contribuir para a combustão de outros materiais.',
    subClasses: ['5.1 Substâncias Oxidantes', '5.2 Peróxidos Orgânicos'],
    handlingPrecautions: [
      'Isolar totalmente de materiais orgânicos, ácidos ou inflamáveis.',
      'Proteger do calor direto do sol.',
      'Controlar poeiras acumuladas.'
    ],
    packagingRequirements: 'Recipientes de alta pureza inorgânica (plásticos especiais ou vidros reforçados).'
  },
  {
    id: 'class-6',
    classNumber: '6',
    name: 'Substâncias Tóxicas / Infectantes',
    color: '#002046',
    textColor: '#FFFFFF',
    description: 'Substâncias que podem causar morte, lesões graves ou danos à saúde humana se ingeridas, inaladas ou colocadas em contato com a pele. Inclui os resíduos hospitalares de risco biológico (Classe 6.2 - Substâncias Infectantes / UN 3291).',
    subClasses: ['6.1 Substâncias Tóxicas', '6.2 Substâncias Infectantes (Biologicos/Hospitalares)'],
    handlingPrecautions: [
      'Utilizar EPIs completos (luvas de nitrila, óculos, bota de PVC, máscara se aplicável).',
      'Proibição de carregamento conjunto com alimentos ou insumos hospitalares limpos.',
      'Proceder com lavagem do veículo após descarga.'
    ],
    packagingRequirements: 'Sacos vermelhos espessos (Grupo A), recipientes rígidos estanques fechados com lacre duplo (NBR 12810).'
  },
  {
    id: 'class-7',
    classNumber: '7',
    name: 'Material Radioativo',
    color: '#7B1FA2',
    textColor: '#FFFFFF',
    description: 'Qualquer material que contenha radionuclídeos cuja atividade específica exceda os valores de isenção regulamentados pela CNEN.',
    subClasses: ['Categoria I - Branca', 'Categoria II - Amarela', 'Categoria III - Amarela'],
    handlingPrecautions: [
      'Manter distanciamento máximo da cabine do motorista.',
      'Monitorar continuamente a radiação na superfície externa.',
      'Portar ficha de autorização e plano de emergência radioativa homologado pela CNEN.'
    ],
    packagingRequirements: 'Embalagens de chumbo blindado e recipientes externos de aço especial contra acidentes críticos.'
  },
  {
    id: 'class-8',
    classNumber: '8',
    name: 'Substâncias Corrosivas',
    color: '#FFFFFF',
    textColor: '#000000',
    description: 'Substâncias que, por ação química, causam severos danos quando em contato com tecidos vivos, ou destroem outras cargas metálicas em caso de vazamento.',
    subClasses: ['Ácidos Fortes', 'Bases / Alcalinos'],
    handlingPrecautions: [
      'Ter neutralizadores químicos específicos disponíveis no kit de emergência.',
      'Evitar inalação de vapores ácidos utilizando máscaras com filtro químico.',
      'Segregar ácidos de bases.'
    ],
    packagingRequirements: 'Garrafões de polietileno de alta densidade (PEAD) protegidos por engradados de contenção de impactos.'
  },
  {
    id: 'class-9',
    classNumber: '9',
    name: 'Substâncias Perigosas Diversas',
    color: '#455A64',
    textColor: '#FFFFFF',
    description: 'Substâncias ou artigos que, durante o transporte, apresentam riscos não cobertos pelas outras classes (ex: baterias de lítio, substâncias que poluem o meio ambiente, cargas aquecidas).',
    subClasses: ['Poluentes Ambientais', 'Micro-organismos Modificados', 'Dispositivos de Segurança'],
    handlingPrecautions: [
      'Verificar integridade estrutural física de baterias.',
      'Proteger contra curto-circuitos isolando polos metálicos.',
      'Evitar vazamento de óleos poluentes no leito da rodovia.'
    ],
    packagingRequirements: 'Caixas de fibra de alta resistência e contenção de líquido absorvente interna.'
  }
];
