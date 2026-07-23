/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Settings, Shield, Globe, Terminal, RefreshCw, CheckCircle, HelpCircle } from 'lucide-react';

interface SettingsViewProps {
  isLocal: boolean;
  onClearHistory: () => void;
}

export default function SettingsView({ isLocal, onClearHistory }: SettingsViewProps) {
  const [copiedKey, setCopiedKey] = useState(false);

  const handleCopyEndpoint = () => {
    navigator.clipboard.writeText('https://seleriluis.services.ai.azure.com/api/projects/proj-default');
    setCopiedKey(true);
    setTimeout(() => setCopiedKey(false), 2000);
  };

  return (
    <div className="flex-1 p-8 overflow-y-auto h-full space-y-6" id="settings-workspace">
      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-[#002046] mb-2 font-sans flex items-center gap-2">
          <Settings className="w-5 h-5 text-[#1b365d]" />
          Configurações do Terminal de Integração
        </h1>
        <p className="text-xs text-gray-500 max-w-3xl leading-relaxed">
          Monitore o status do agente Foundry remoto, configure as rotas de proxy de API localizadas no servidor Express e reinicie sessões de conformidade técnica para testes.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Left Card: Connection credentials */}
        <div className="bg-white border border-[#eceef0] rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 font-sans">
            <Shield className="w-4 h-4 text-gray-400" />
            Parâmetros do Foundry Agent (Colab Python)
          </h2>

          <div className="space-y-3 font-mono text-xs">
            <div>
              <span className="text-[10px] text-gray-400 uppercase font-sans">Nome do Agente</span>
              <div className="bg-gray-50 border border-gray-100 p-2.5 rounded font-bold text-gray-800">
                transporte-rss-pp
              </div>
            </div>

            <div>
              <span className="text-[10px] text-gray-400 uppercase font-sans">Endpoint Original do Projeto Azure AI</span>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  readOnly
                  value="https://seleriluis.services.ai.azure.com/api/projects/proj-default"
                  className="bg-gray-50 border border-gray-100 p-2.5 rounded text-gray-500 select-all flex-1 text-[10px]"
                />
                <button
                  onClick={handleCopyEndpoint}
                  className="px-3 py-2 bg-[#eceef0] text-gray-700 rounded hover:bg-[#e0e3e5] font-sans font-semibold text-xs shrink-0 transition-colors"
                >
                  {copiedKey ? 'Copiado!' : 'Copiar'}
                </button>
              </div>
            </div>

            <div>
              <span className="text-[10px] text-gray-400 uppercase font-sans">Chave de API (api-key)</span>
              <div className="bg-gray-50 border border-gray-100 p-2.5 rounded text-gray-400 truncate select-all">
                7kHsZ74t0CFMaSbhOa2inPB... (Mascarada para Segurança)
              </div>
            </div>
          </div>
        </div>

        {/* Right Card: Full-Stack Proxy Endpoints */}
        <div className="bg-white border border-[#eceef0] rounded-xl p-6 shadow-sm space-y-4">
          <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider flex items-center gap-2 font-sans">
            <Terminal className="w-4 h-4 text-gray-400" />
            Serviço de Proxy e Análise Estruturada
          </h2>

          <p className="text-xs text-gray-500 font-sans leading-relaxed">
            As chamadas abaixo são executadas pelo frontend diretamente para o servidor Express local (`port 3000`), encapsulando chaves de API secretas e alimentando a inteligência artificial analítica.
          </p>

          <div className="space-y-2 font-mono text-[11px]">
            <div className="flex items-center gap-2 border border-gray-100 rounded p-2 hover:bg-gray-50 transition-colors">
              <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold text-[10px]">POST</span>
              <span className="text-gray-700 flex-1 font-semibold">/api/conversations</span>
              <span className="text-[10px] text-gray-400 font-sans">Cria conversa no Foundry</span>
            </div>

            <div className="flex items-center gap-2 border border-gray-100 rounded p-2 hover:bg-gray-50 transition-colors">
              <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold text-[10px]">POST</span>
              <span className="text-gray-700 flex-1 font-semibold">/api/chat</span>
              <span className="text-[10px] text-gray-400 font-sans">Envia chat e analisa conformidade</span>
            </div>

            <div className="flex items-center gap-2 border border-gray-100 rounded p-2 hover:bg-gray-50 transition-colors">
              <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-bold text-[10px]">POST</span>
              <span className="text-gray-700 flex-1 font-semibold">/api/fill-field</span>
              <span className="text-[10px] text-gray-400 font-sans">Preenchimento estruturado rápido</span>
            </div>
          </div>
        </div>
      </div>

      {/* Advanced diagnostics & actions */}
      <div className="bg-white border border-[#eceef0] rounded-xl p-6 shadow-sm space-y-4">
        <h2 className="text-xs font-bold text-[#ba1a1a] uppercase tracking-wider flex items-center gap-2 font-sans">
          Controles do Operador e Manutenção
        </h2>
        <p className="text-xs text-gray-500 font-sans leading-relaxed max-w-2xl">
          Use estes controles para limpar o histórico de conversas locais em memória, redefinir a triagem do sistema para os padrões ou forçar a reinstanciação do assistente analítico.
        </p>

        <div className="flex items-center gap-3 pt-2">
          <button
            onClick={() => {
              onClearHistory();
              alert('Sessão redefinida e dados limpos com sucesso!');
            }}
            className="px-4 py-2 bg-red-50 text-red-700 border border-red-200 rounded-lg hover:bg-red-100 transition-colors font-sans font-semibold text-xs flex items-center gap-2 cursor-pointer"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            Limpar Memória do Terminal e Reiniciar Sessão
          </button>
        </div>
      </div>
    </div>
  );
}
