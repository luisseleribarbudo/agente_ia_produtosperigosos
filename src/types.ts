/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface ComplianceState {
  cargaTipo: 'RSS' | 'Produto Perigoso' | '';
  classeRisco: string;
  grupo: string;
  codigoOnu: string;
  quantidade: string;
  embalagem: string;
  pontoFulgor: string;
  riscoSubsidiario: string;
  mopp: 'Sim' | 'Não' | 'Pendente' | 'N/A';
  cipp: 'Sim' | 'Não' | 'Pendente' | 'N/A';
}

export interface MissingField {
  key: keyof ComplianceState;
  label: string;
  reason: string;
  question: string;
}

export interface DocumentStatus {
  name: string;
  checked: boolean;
  requiredBy: string;
}

export interface ParecerTecnico {
  id: string;
  timestamp: string;
  resumo: string;
  analise: string;
  pontoFulgor: string;
  riscoSubsidiario: string;
  documentacaoConsultada: string[];
  documentosNecessarios: DocumentStatus[];
  alertasCriticos: string[];
  status: 'Rascunho' | 'Aprovado' | 'Rejeitado';
  progresso: number; // 0 a 100
}

export interface ConsultationSession {
  id: string;
  isLocal: boolean;
  messages: Message[];
  complianceState: ComplianceState;
  missingFields: MissingField[];
  parecerTecnico: ParecerTecnico | null;
}
