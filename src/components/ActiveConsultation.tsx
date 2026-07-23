/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, 
  Loader2, 
  CheckSquare, 
  AlertTriangle, 
  FileText, 
  CheckCircle, 
  HelpCircle,
  PlusCircle,
  Clock,
  ExternalLink,
  Lock,
  RefreshCw
} from 'lucide-react';
import { ConsultationSession, Message, ComplianceState, MissingField } from '../types';

interface ActiveConsultationProps {
  session: ConsultationSession;
  isLoading: boolean;
  onSendMessage: (msg: string) => void;
  onFillFieldDirect: (key: keyof ComplianceState, value: string) => void;
  onResetSession: () => void;
}

export default function ActiveConsultation({ 
  session, 
  isLoading, 
  onSendMessage, 
  onFillFieldDirect,
  onResetSession 
}: ActiveConsultationProps) {
  const [inputText, setInputText] = useState('');
  const [activeQuickField, setActiveQuickField] = useState<keyof ComplianceState | null>(null);
  const [customInputValue, setCustomInputValue] = useState('');
  const [showCertificate, setShowCertificate] = useState(false);
  
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [session.messages, isLoading]);

  const handleSubmitMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;
    onSendMessage(inputText);
    setInputText('');
  };

  const handleQuickOptionSubmit = (key: keyof ComplianceState, value: string) => {
    onFillFieldDirect(key, value);
    setActiveQuickField(null);
    setCustomInputValue('');
  };

  const getStatusColor = (status: string) => {
    if (status === 'Aprovado') return 'bg-emerald-100 text-emerald-800 border-emerald-300';
    if (status === 'Rejeitado') return 'bg-red-100 text-red-800 border-red-300';
    return 'bg-amber-100 text-amber-800 border-amber-300';
  };

  const formatTimestamp = (isoString: string) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  return (
    <div className="flex-1 flex overflow-hidden h-full" id="active-consultation-grid">
      {/* Central Chat Workspace */}
      <div className="w-full flex flex-col h-full bg-white relative">
        {/* Chat Header */}
        <div className="px-8 py-4 border-b border-[#eceef0] flex items-center justify-between bg-white shrink-0">
          <div className="max-w-4xl mx-auto w-full flex items-center justify-between">
            <div>
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider font-mono">Terminal de Diagnóstico</span>
              <h2 className="text-sm font-bold text-[#002046] font-sans flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block animate-pulse"></span>
                Assistente Técnico ANTT & ANVISA
              </h2>
            </div>
            <button 
              onClick={onResetSession}
              className="text-[11px] font-sans font-bold text-gray-500 hover:text-[#002046] flex items-center gap-1 bg-gray-50 hover:bg-[#eceef0]/60 border border-gray-200 px-3 py-1.5 rounded-lg transition-colors cursor-pointer"
            >
              <RefreshCw className="w-3 h-3" />
              Nova Consulta de Carga
            </button>
          </div>
        </div>

        {/* Chat Message Box */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50/50">
          <div className="max-w-4xl mx-auto w-full space-y-4 flex flex-col">
            {session.messages.map((msg) => {
              const isUser = msg.role === 'user';
              return (
                <div 
                  key={msg.id} 
                  className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[85%] rounded-xl p-4 shadow-sm text-xs leading-relaxed font-sans ${
                    isUser 
                      ? 'bg-[#002046] text-white rounded-tr-none' 
                      : 'bg-white text-gray-800 border border-[#eceef0] rounded-tl-none'
                  }`}>
                    <div className="flex items-center justify-between gap-6 mb-1.5 text-[10px] font-bold opacity-60">
                      <span>{isUser ? 'Você' : 'transporte-rss-pp'}</span>
                      <span>{formatTimestamp(msg.timestamp)}</span>
                    </div>
                    <p className="whitespace-pre-line font-sans">{msg.content}</p>
                  </div>
                </div>
              );
            })}

            {isLoading && (
              <div className="flex justify-start">
                <div className="bg-white text-gray-500 border border-[#eceef0] rounded-xl rounded-tl-none p-4 flex items-center gap-2 text-xs font-sans shadow-sm">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-[#002046]" />
                  O agente está processando as regulamentações técnicas brasileiras...
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
        </div>

        {/* Dynamic Missing Data (Structured Quick reply overlays) */}
        {session.missingFields.length > 0 && !isLoading && (
          <div className="bg-white border-t border-[#eceef0] py-3 px-6 shrink-0">
            <div className="max-w-4xl mx-auto w-full">
              <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-2 font-sans">
                Selecione um parâmetro para preenchimento rápido estruturado:
              </span>
              <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto">
                {session.missingFields.map((field) => (
                  <button
                    key={field.key}
                    onClick={() => {
                      setActiveQuickField(activeQuickField === field.key ? null : field.key);
                      setCustomInputValue('');
                    }}
                    className={`text-[10px] font-sans font-bold px-2.5 py-1.5 rounded-md border transition-all cursor-pointer ${
                      activeQuickField === field.key
                        ? 'bg-amber-100 border-amber-400 text-amber-900 shadow-sm'
                        : 'bg-[#eceef0]/50 border-transparent hover:border-[#002046]/40 text-[#002046]'
                    }`}
                  >
                    + Fornecer {field.label}
                  </button>
                ))}
              </div>

              {/* Inline interactive selector for active quick field */}
              {activeQuickField && (
                <div className="mt-3 bg-amber-50/70 border border-amber-200/50 rounded-lg p-3 text-xs shadow-inner animate-fadeIn">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <p className="font-semibold text-amber-950 font-sans">
                      {session.missingFields.find(f => f.key === activeQuickField)?.question}
                    </p>
                    <span className="text-[9px] font-mono text-amber-600 bg-white border border-amber-200 px-1 py-0.5 rounded uppercase font-bold">
                      {activeQuickField}
                    </span>
                  </div>
                  
                  {/* Specific option buttons */}
                  {activeQuickField === 'cargaTipo' && (
                    <div className="flex gap-2">
                      <button 
                        onClick={() => handleQuickOptionSubmit('cargaTipo', 'RSS')}
                        className="px-3 py-2 bg-white hover:bg-[#002046] hover:text-white border border-[#eceef0] rounded-lg font-sans font-bold text-xs cursor-pointer transition-all flex-1 text-[#002046]"
                      >
                        Resíduo de Serviço de Saúde (RSS)
                      </button>
                      <button 
                        onClick={() => handleQuickOptionSubmit('cargaTipo', 'Produto Perigoso')}
                        className="px-3 py-2 bg-white hover:bg-[#002046] hover:text-white border border-[#eceef0] rounded-lg font-sans font-bold text-xs cursor-pointer transition-all flex-1 text-[#002046]"
                      >
                        Outro Produto Perigoso
                      </button>
                    </div>
                  )}

                  {activeQuickField === 'classeRisco' && (
                    <div className="flex flex-wrap gap-2">
                      <button 
                        onClick={() => handleQuickOptionSubmit('classeRisco', 'Classe 6.2 - Substâncias Infectantes')}
                        className="px-2.5 py-1.5 bg-white hover:bg-[#002046] hover:text-white border border-[#eceef0] rounded font-sans font-semibold text-xs cursor-pointer transition-all"
                      >
                        Classe 6.2 - Infectantes
                      </button>
                      <button 
                        onClick={() => handleQuickOptionSubmit('classeRisco', 'Classe 3 - Líquidos Inflamáveis')}
                        className="px-2.5 py-1.5 bg-white hover:bg-[#002046] hover:text-white border border-[#eceef0] rounded font-sans font-semibold text-xs cursor-pointer transition-all"
                      >
                        Classe 3 - Inflamáveis
                      </button>
                      <button 
                        onClick={() => handleQuickOptionSubmit('classeRisco', 'Classe 8 - Substâncias Corrosivas')}
                        className="px-2.5 py-1.5 bg-white hover:bg-[#002046] hover:text-white border border-[#eceef0] rounded font-sans font-semibold text-xs cursor-pointer transition-all"
                      >
                        Classe 8 - Corrosivas
                      </button>
                    </div>
                  )}

                  {activeQuickField === 'grupo' && (
                    <div className="flex flex-wrap gap-2">
                      {['Grupo A1 (Biológico)', 'Grupo A2 (Biológico)', 'Grupo B (Químico)', 'Grupo E (Perfurocortante)'].map(val => (
                        <button 
                          key={val}
                          onClick={() => handleQuickOptionSubmit('grupo', val)}
                          className="px-2.5 py-1.5 bg-white hover:bg-[#002046] hover:text-white border border-[#eceef0] rounded font-sans font-semibold text-[10px] cursor-pointer transition-all"
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  )}

                  {activeQuickField === 'embalagem' && (
                    <div className="flex flex-wrap gap-2">
                      {['Saco Vermelho NBR 9191', 'Recipiente Rígido NBR 12810', 'Bombona Plástica PEAD Homologada'].map(val => (
                        <button 
                          key={val}
                          onClick={() => handleQuickOptionSubmit('embalagem', val)}
                          className="px-2.5 py-1.5 bg-white hover:bg-[#002046] hover:text-white border border-[#eceef0] rounded font-sans font-semibold text-[10px] cursor-pointer transition-all"
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Generic input field fallback for other missing fields like ONU and quantidade */}
                  {['codigoOnu', 'quantidade', 'pontoFulgor', 'riscoSubsidiario'].includes(activeQuickField) && (
                    <form 
                      onSubmit={(e) => {
                        e.preventDefault();
                        if (customInputValue.trim()) {
                          handleQuickOptionSubmit(activeQuickField, customInputValue.trim());
                        }
                      }}
                      className="flex gap-2"
                    >
                      <input
                        type="text"
                        placeholder={activeQuickField === 'codigoOnu' ? 'Ex: UN 3291 ou UN 1203' : activeQuickField === 'quantidade' ? 'Ex: 500 kg ou 200 litros' : 'Digite o valor de conformidade...'}
                        value={customInputValue}
                        onChange={(e) => setCustomInputValue(e.target.value)}
                        className="flex-1 bg-white border border-[#eceef0] p-2 rounded text-xs text-gray-800 focus:outline-none focus:ring-1 focus:ring-[#002046]"
                      />
                      <button
                        type="submit"
                        className="px-3 py-2 bg-[#002046] hover:bg-[#1b365d] text-white rounded font-sans font-bold text-xs shrink-0 cursor-pointer"
                      >
                        Confirmar
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Input Bar */}
        <div className="p-4 border-t border-[#eceef0] bg-white shrink-0">
          <form 
            onSubmit={handleSubmitMessage}
            className="max-w-4xl mx-auto w-full flex gap-2 items-center"
          >
            <input
              type="text"
              disabled={isLoading}
              placeholder={isLoading ? "Aguardando resposta do agente..." : "Digite uma pergunta ou envie documentos para caracterização da carga..."}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              className="flex-1 px-4 py-2.5 bg-gray-50 border border-[#eceef0] rounded-xl text-xs text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#002046] focus:border-transparent font-sans"
            />
            <button
              type="submit"
              disabled={isLoading || !inputText.trim()}
              className="p-2.5 bg-[#002046] text-white rounded-xl hover:bg-[#1b365d] disabled:bg-gray-200 disabled:text-gray-400 transition-colors shrink-0 cursor-pointer"
            >
              <Send className="w-4 h-4" />
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
