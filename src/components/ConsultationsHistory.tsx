/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { FileText, PlusCircle, CheckCircle2, AlertTriangle, HelpCircle, ArrowRight } from 'lucide-react';
import { ConsultationSession } from '../types';

interface ConsultationsHistoryProps {
  sessionsList: ConsultationSession[];
  currentSessionId: string | null;
  onSelectSession: (id: string) => void;
  onStartNewSession: () => void;
}

export default function ConsultationsHistory({
  sessionsList,
  currentSessionId,
  onSelectSession,
  onStartNewSession
}: ConsultationsHistoryProps) {
  const getStatusBadge = (status: string) => {
    if (status === 'Aprovado') {
      return (
        <span className="inline-flex items-center gap-1 bg-emerald-50 text-emerald-700 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono">
          <CheckCircle2 className="w-3 h-3 text-emerald-500" />
          APROVADO
        </span>
      );
    }
    if (status === 'Rejeitado') {
      return (
        <span className="inline-flex items-center gap-1 bg-red-50 text-red-700 border border-red-200 text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono">
          <AlertTriangle className="w-3 h-3 text-red-500" />
          REJEITADO
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 bg-amber-50 text-amber-700 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded uppercase font-mono">
        <HelpCircle className="w-3 h-3 text-amber-500" />
        RASCUNHO
      </span>
    );
  };

  return (
    <div className="flex-1 p-8 flex flex-col overflow-hidden h-full" id="consultations-workspace">
      {/* Header */}
      <div className="flex items-center justify-between mb-6 shrink-0">
        <div>
          <h1 className="text-xl font-bold text-[#002046] mb-2 font-sans flex items-center gap-2">
            <FileText className="w-5 h-5 text-[#1b365d]" />
            Consultas Técnicas e Pareceres Emitidos
          </h1>
          <p className="text-xs text-gray-500 max-w-2xl leading-relaxed">
            Consulte o histórico de triagens técnicas e pareceres emitidos pelo terminal de regulação. Você pode revisar rascunhos em andamento ou reabrir relatórios concluídos.
          </p>
        </div>

        <button
          onClick={onStartNewSession}
          className="px-4 py-2.5 bg-[#002046] text-white rounded-lg hover:bg-[#1b365d] font-sans font-bold text-xs flex items-center gap-1.5 transition-all shadow-sm cursor-pointer"
        >
          <PlusCircle className="w-4 h-4" />
          Nova Consulta Técnica
        </button>
      </div>

      {/* Grid List */}
      <div className="flex-1 overflow-y-auto bg-white border border-[#eceef0] rounded-xl shadow-sm">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#eceef0]/30 border-b border-[#eceef0] text-[10px] uppercase tracking-wider text-gray-500 font-bold font-sans">
              <th className="py-3 px-6">ID Parecer</th>
              <th className="py-3 px-6">Tipo de Carga</th>
              <th className="py-3 px-6">Classe / ONU</th>
              <th className="py-3 px-6">Progresso</th>
              <th className="py-3 px-6">Status Geral</th>
              <th className="py-3 px-6 text-right">Ação</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-[#eceef0] text-xs font-sans text-gray-700">
            {sessionsList.map((sessionItem) => {
              const pt = sessionItem.parecerTecnico;
              const isCurrent = sessionItem.id === currentSessionId;
              return (
                <tr 
                  key={sessionItem.id}
                  className={`hover:bg-[#eceef0]/15 transition-colors ${
                    isCurrent ? 'bg-[#eceef0]/35 font-semibold' : ''
                  }`}
                >
                  <td className="py-4 px-6 font-mono font-bold text-[#002046]">
                    #{pt?.id || 'RASCUNHO'}
                  </td>
                  <td className="py-4 px-6 font-sans">
                    {sessionItem.complianceState.cargaTipo || 'Não Especificado'}
                    {sessionItem.complianceState.grupo && ` (${sessionItem.complianceState.grupo})`}
                  </td>
                  <td className="py-4 px-6">
                    <span className="font-mono font-medium block">
                      {sessionItem.complianceState.classeRisco || 'Análise Pendente'}
                    </span>
                    <span className="font-mono text-[10px] text-gray-400 block mt-0.5">
                      {sessionItem.complianceState.codigoOnu || 'Sem ONU'}
                    </span>
                  </td>
                  <td className="py-4 px-6 font-mono font-bold">
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-gray-200 h-1.5 rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${pt?.progresso || 10}%` }}
                          className="bg-emerald-500 h-full"
                        ></div>
                      </div>
                      <span>{pt?.progresso || 10}%</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    {getStatusBadge(pt?.status || 'Rascunho')}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button
                      onClick={() => onSelectSession(sessionItem.id)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 bg-[#eceef0] hover:bg-[#002046] hover:text-white rounded text-xs font-semibold text-gray-700 transition-colors cursor-pointer font-sans"
                    >
                      Abrir no Terminal
                      <ArrowRight className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              );
            })}

            {sessionsList.length === 0 && (
              <tr>
                <td colSpan={6} className="py-12 text-center text-gray-400 font-sans">
                  Nenhuma consulta iniciada neste terminal. Comece uma nova consulta no botão acima!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
