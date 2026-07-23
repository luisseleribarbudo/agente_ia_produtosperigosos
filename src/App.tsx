/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Activity, 
  HelpCircle, 
  Settings as SettingsIcon, 
  ShieldAlert,
  PlusCircle,
  FileText,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  AlertTriangle,
  ChevronRight,
  Info
} from 'lucide-react';

import Sidebar from './components/Sidebar';
import ActiveConsultation from './components/ActiveConsultation';
import ConsultationsHistory from './components/ConsultationsHistory';
import LegislationView from './components/LegislationView';
import HazmatClassesView from './components/HazmatClassesView';
import SettingsView from './components/SettingsView';

import { ConsultationSession, ComplianceState } from './types';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [currentSession, setCurrentSession] = useState<ConsultationSession | null>(null);
  const [sessionsList, setSessionsList] = useState<ConsultationSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);

  // Inicializa o terminal criando uma nova consulta em segundo plano ou carregando as sessões
  useEffect(() => {
    const initApp = async () => {
      try {
        setIsInitializing(true);
        const response = await fetch('/api/conversations', { method: 'POST' });
        if (response.ok) {
          const data = await response.json();
          const newSession: ConsultationSession = {
            id: data.sessionId,
            isLocal: data.session.isLocal ?? true,
            messages: data.session.messages,
            complianceState: data.session.complianceState,
            missingFields: data.session.missingFields,
            parecerTecnico: data.session.parecerTecnico,
          };
          setCurrentSession(newSession);
          setSessionsList([newSession]);
        }
      } catch (err) {
        console.error('Falha ao inicializar o terminal de conformidade:', err);
      } finally {
        setIsInitializing(false);
      }
    };
    initApp();
  }, []);

  // Handler para iniciar uma nova consulta limpa
  const handleStartNewSession = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/conversations', { method: 'POST' });
      if (response.ok) {
        const data = await response.json();
        const newSession: ConsultationSession = {
          id: data.sessionId,
          isLocal: data.session.isLocal ?? true,
          messages: data.session.messages,
          complianceState: data.session.complianceState,
          missingFields: data.session.missingFields,
          parecerTecnico: data.session.parecerTecnico,
        };
        setCurrentSession(newSession);
        setSessionsList((prev) => [newSession, ...prev]);
        setActiveTab('dashboard');
      }
    } catch (err) {
      console.error('Erro ao criar nova consulta:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler para enviar mensagem no chat
  const handleSendMessage = async (content: string) => {
    if (!currentSession || isLoading) return;

    try {
      setIsLoading(true);
      
      // Otimisticamente adiciona a mensagem do usuário no frontend antes do fetch acabar
      const updatedMessages = [
        ...currentSession.messages,
        {
          id: 'user_temp_' + Math.random(),
          role: 'user' as const,
          content,
          timestamp: new Date().toISOString()
        }
      ];
      setCurrentSession({
        ...currentSession,
        messages: updatedMessages
      });

      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSession.id,
          message: content,
          session: currentSession
        })
      });

      if (response.ok) {
        const data = await response.json();
        const updatedSession: ConsultationSession = {
          id: data.sessionId,
          isLocal: data.session.isLocal ?? currentSession.isLocal,
          messages: data.session.messages,
          complianceState: data.session.complianceState,
          missingFields: data.session.missingFields,
          parecerTecnico: data.session.parecerTecnico,
        };
        
        setCurrentSession(updatedSession);
        
        // Atualiza a lista geral de sessões
        setSessionsList((prev) => 
          prev.map((s) => s.id === currentSession.id ? updatedSession : s)
        );
      }
    } catch (err) {
      console.error('Erro ao enviar mensagem:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Handler para preenchimento rápido estruturado de campos
  const handleFillFieldDirect = async (key: keyof ComplianceState, value: string) => {
    if (!currentSession || isLoading) return;

    try {
      setIsLoading(true);

      const response = await fetch('/api/fill-field', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sessionId: currentSession.id,
          key,
          value,
          session: currentSession
        })
      });

      if (response.ok) {
        const data = await response.json();
        const updatedSession: ConsultationSession = {
          id: data.sessionId,
          isLocal: data.session.isLocal ?? currentSession.isLocal,
          messages: data.session.messages,
          complianceState: data.session.complianceState,
          missingFields: data.session.missingFields,
          parecerTecnico: data.session.parecerTecnico,
        };
        
        setCurrentSession(updatedSession);
        
        // Atualiza a lista de sessões
        setSessionsList((prev) => 
          prev.map((s) => s.id === currentSession.id ? updatedSession : s)
        );
      }
    } catch (err) {
      console.error('Erro ao preencher campo diretamente:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Carrega uma consulta específica do histórico no terminal ativo
  const handleSelectSession = (id: string) => {
    const selected = sessionsList.find((s) => s.id === id);
    if (selected) {
      setCurrentSession(selected);
      setActiveTab('dashboard');
    }
  };

  // Configuração rápida usando templates pré-configurados (Atalhos de Simulação)
  const handleApplyTemplate = async (type: 'gasolina' | 'hospitalar') => {
    try {
      setIsLoading(true);
      // Cria uma nova conversa limpa
      const resConv = await fetch('/api/conversations', { method: 'POST' });
      if (!resConv.ok) return;
      const dataConv = await resConv.json();
      let currentSessionData: ConsultationSession = {
        id: dataConv.sessionId,
        isLocal: dataConv.session.isLocal ?? true,
        messages: dataConv.session.messages,
        complianceState: dataConv.session.complianceState,
        missingFields: dataConv.session.missingFields,
        parecerTecnico: dataConv.session.parecerTecnico,
      };

      if (type === 'gasolina') {
        // Preenche com combustível inflamável UN 1203
        const fields = [
          { key: 'cargaTipo', value: 'Produto Perigoso' },
          { key: 'classeRisco', value: 'Classe 3 - Líquidos Inflamáveis' },
          { key: 'codigoOnu', value: 'UN 1203' }
        ];

        for (const field of fields) {
          const res = await fetch('/api/fill-field', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: currentSessionData.id,
              key: field.key,
              value: field.value,
              session: currentSessionData
            })
          });
          if (res.ok) {
            const data = await res.json();
            currentSessionData = {
              id: data.sessionId,
              isLocal: data.session.isLocal ?? currentSessionData.isLocal,
              messages: data.session.messages,
              complianceState: data.session.complianceState,
              missingFields: data.session.missingFields,
              parecerTecnico: data.session.parecerTecnico,
            };
          }
        }

        setCurrentSession(currentSessionData);
        setSessionsList((prev) => [currentSessionData, ...prev.filter(s => s.id !== currentSessionData.id)]);

      } else if (type === 'hospitalar') {
        // Preenche com resíduos infectantes hospitalares UN 3291
        const fields = [
          { key: 'cargaTipo', value: 'RSS' },
          { key: 'grupo', value: 'Grupo A1 (Biológico)' },
          { key: 'classeRisco', value: 'Classe 6.2 - Substâncias Infectantes' },
          { key: 'codigoOnu', value: 'UN 3291' }
        ];

        for (const field of fields) {
          const res = await fetch('/api/fill-field', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              sessionId: currentSessionData.id,
              key: field.key,
              value: field.value,
              session: currentSessionData
            })
          });
          if (res.ok) {
            const data = await res.json();
            currentSessionData = {
              id: data.sessionId,
              isLocal: data.session.isLocal ?? currentSessionData.isLocal,
              messages: data.session.messages,
              complianceState: data.session.complianceState,
              missingFields: data.session.missingFields,
              parecerTecnico: data.session.parecerTecnico,
            };
          }
        }

        setCurrentSession(currentSessionData);
        setSessionsList((prev) => [currentSessionData, ...prev.filter(s => s.id !== currentSessionData.id)]);
      }
    } catch (err) {
      console.error('Falha ao injetar template:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearHistory = () => {
    setCurrentSession(null);
    setSessionsList([]);
    handleStartNewSession();
  };

  return (
    <div className="flex h-screen bg-gray-50 text-[#191c1e] font-sans overflow-hidden" id="compliance-protocol-app">
      {/* Sidebar navigation */}
      <Sidebar 
        activeTab={activeTab} 
        setActiveTab={setActiveTab} 
        isLocal={currentSession?.isLocal ?? true} 
      />

      {/* Main Container */}
      <div className="flex-1 flex flex-col overflow-hidden h-full">
        {/* Top Header Navigation */}
        <header className="h-16 bg-white border-b border-[#eceef0] flex items-center justify-between px-8 shrink-0 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-xs text-gray-500 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Ativo
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-gray-50 border border-gray-100 rounded-lg p-1.5 px-3">
              <span className="text-[10px] text-gray-400 font-mono">UTILITY LEVEL:</span>
              <span className="text-xs font-bold text-[#002046] font-mono">INTERNAL PROTOCOL</span>
            </div>
            
            <button 
              onClick={() => setActiveTab('settings')}
              className="p-2 text-gray-400 hover:text-[#002046] rounded-lg hover:bg-gray-50 transition-colors"
              title="Configurações do Sistema"
            >
              <SettingsIcon className="w-5 h-5" />
            </button>
            
            {/* User Profile avatar info */}
            <div className="flex items-center gap-2 pl-2 border-l border-gray-200">
              <div className="w-8 h-8 rounded-full bg-[#002046] text-white flex items-center justify-center font-bold text-xs shadow-inner">
                LS
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-[#002046] leading-tight">L. Seleri</p>
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic workspace area based on activeTab */}
        <main className="flex-1 overflow-hidden h-full bg-gray-50/50">
          {isInitializing ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <Loader2Icon className="w-8 h-8 animate-spin text-[#002046]" />
              <p className="text-sm text-gray-500 font-sans">Carregando o protocolo técnico e iniciando o agente...</p>
            </div>
          ) : (
            <>
              {activeTab === 'dashboard' && currentSession && (
                <div className="h-full flex flex-col overflow-hidden">
                  {/* If the current session is brand new and has default/empty values, we show a gorgeous welcome wizard */}
                  {currentSession.complianceState.cargaTipo === '' && currentSession.messages.length <= 1 ? (
                    <div className="flex-1 p-8 overflow-y-auto flex flex-col justify-center max-w-4xl mx-auto w-full space-y-6">
                      <div className="text-center space-y-2">
                        <div className="w-16 h-16 rounded-2xl bg-[#002046]/5 mx-auto flex items-center justify-center border border-[#002046]/10 shadow-sm">
                          <ShieldCheck className="w-9 h-9 text-[#002046]" />
                        </div>
                        <h2 className="text-xl font-extrabold text-[#002046] font-sans tracking-tight pt-2">Consulta de Produtos Perigosos</h2>
                        <p className="text-xs text-gray-500 max-w-lg mx-auto font-sans">
                          Siga as diretrizes regulatórias das normas ANTT 5947/21 e ABNT NBR 12810. O agente irá orientar a triagem e gerar o parecer dinamicamente.
                        </p>
                      </div>

                      {/* Option cards */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                        {/* Template 1: Inflamável */}
                        <button
                          onClick={() => handleApplyTemplate('gasolina')}
                          className="bg-white border border-[#eceef0] p-5 rounded-xl text-left hover:border-[#002046] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-48 group shadow-sm"
                        >
                          <div>
                            <span className="text-[10px] font-mono font-bold text-orange-600 bg-orange-50 border border-orange-100 px-2 py-0.5 rounded uppercase">
                              Template Inflamáveis
                            </span>
                            <h3 className="text-sm font-bold text-[#002046] mt-3 font-sans group-hover:text-orange-600 transition-colors">
                              Gasolina Comercial (UN 1203)
                            </h3>
                            <p className="text-xs text-gray-500 mt-2 font-sans leading-relaxed">
                              Simule o transporte rodoviário de combustíveis de Classe 3. Inicia a triagem técnica com enquadramento de líquido inflamável, solicitando volumes para cálculo de MOPP/CIPP.
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#002046] mt-4 self-end">
                            Carregar Simulação
                            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                          </div>
                        </button>

                        {/* Template 2: Resíduo de Saúde Infectante */}
                        <button
                          onClick={() => handleApplyTemplate('hospitalar')}
                          className="bg-white border border-[#eceef0] p-5 rounded-xl text-left hover:border-[#002046] hover:shadow-md transition-all cursor-pointer flex flex-col justify-between h-48 group shadow-sm"
                        >
                          <div>
                            <span className="text-[10px] font-mono font-bold text-[#002046] bg-[#002046]/5 border border-[#002046]/10 px-2 py-0.5 rounded uppercase">
                              Template Hospitalar (RSS)
                            </span>
                            <h3 className="text-sm font-bold text-[#002046] mt-3 font-sans group-hover:text-[#87a0cd] transition-colors">
                              Resíduo Infectante Grupo A1 (UN 3291)
                            </h3>
                            <p className="text-xs text-gray-500 mt-2 font-sans leading-relaxed">
                              Simule o transporte de descartes biológicos de Classe 6.2 (Substâncias Infectantes). Inicializa com as diretrizes da NBR 12810 e RDC 222 da ANVISA.
                            </p>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs font-bold text-[#002046] mt-4 self-end">
                            Carregar Simulação
                            <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                          </div>
                        </button>
                      </div>

                      {/* Custom start directly to chat */}
                      <div className="bg-gray-50 border border-gray-100 p-4 rounded-xl flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2 text-gray-600 font-sans">
                          <Info className="w-4 h-4 text-[#002046]" />
                          <span>Prefere conversar do zero? Vá direto para o chat do assistente.</span>
                        </div>
                        <button
                          onClick={() => handleFillFieldDirect('cargaTipo', 'RSS')}
                          className="px-3.5 py-1.5 bg-[#002046] text-white rounded-lg hover:bg-[#1b365d] transition-colors font-sans font-bold cursor-pointer"
                        >
                          Ir para o Chat
                        </button>
                      </div>
                    </div>
                  ) : (
                    <ActiveConsultation 
                      session={currentSession} 
                      isLoading={isLoading}
                      onSendMessage={handleSendMessage}
                      onFillFieldDirect={handleFillFieldDirect}
                      onResetSession={handleStartNewSession}
                    />
                  )}
                </div>
              )}

              {activeTab === 'consultations' && (
                <ConsultationsHistory 
                  sessionsList={sessionsList}
                  currentSessionId={currentSession?.id ?? null}
                  onSelectSession={handleSelectSession}
                  onStartNewSession={handleStartNewSession}
                />
              )}

              {activeTab === 'legislation' && (
                <LegislationView />
              )}

              {activeTab === 'classes' && (
                <HazmatClassesView />
              )}

              {activeTab === 'archive' && (
                <div className="flex-1 p-8 text-center flex flex-col items-center justify-center h-full">
                  <div className="max-w-md space-y-4">
                    <FileText className="w-12 h-12 text-gray-300 mx-auto" />
                    <h2 className="text-base font-bold text-[#002046] font-sans">Arquivo Técnico Histórico</h2>
                    <p className="text-xs text-gray-500 leading-relaxed font-sans">
                      O arquivo de pareceres antigos de conformidade é sincronizado em lote com as licenças do Sisgema e do IBAMA. Nenhuma consulta arquivada nas últimas 24h foi encontrada.
                    </p>
                    <button
                      onClick={() => setActiveTab('dashboard')}
                      className="px-4 py-2 bg-[#eceef0] hover:bg-[#002046] hover:text-white rounded text-xs font-bold text-[#002046] transition-colors cursor-pointer font-sans"
                    >
                      Voltar ao Painel Ativo
                    </button>
                  </div>
                </div>
              )}

              {activeTab === 'settings' && (
                <SettingsView 
                  isLocal={currentSession?.isLocal ?? true} 
                  onClearHistory={handleClearHistory}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}

// Simple loader helper icon
function Loader2Icon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-6.219-8.56" />
    </svg>
  );
}
