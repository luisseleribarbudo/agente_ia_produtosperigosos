/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  LayoutDashboard, 
  FileText, 
  BookOpen, 
  ShieldAlert, 
  Archive, 
  Settings, 
  Activity,
  HelpCircle
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  isLocal: boolean;
}

export default function Sidebar({ activeTab, setActiveTab, isLocal }: SidebarProps) {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'consultations', label: 'Consultas', icon: FileText },
    { id: 'legislation', label: 'Legislação', icon: BookOpen },
    { id: 'classes', label: 'Classes de Risco', icon: ShieldAlert },
    { id: 'archive', label: 'Arquivo', icon: Archive },
    { id: 'settings', label: 'Configurações', icon: Settings },
  ];

  return (
    <div className="w-64 bg-[#002046] text-white flex flex-col h-full border-r border-[#1b365d]/50" id="app-sidebar">
      {/* Brand Logo and Header */}
      <div className="p-5 border-b border-[#1b365d]/50">
        <div className="flex items-center gap-2 mb-2">
          <Activity className="w-5 h-5 text-emerald-400" />
          <span className="font-mono text-xs tracking-widest text-[#87a0cd] font-bold">TRANSPORTE-RSS-PP</span>
        </div>
        <div className="mt-2 inline-flex items-center gap-1 bg-[#1b365d] px-2 py-0.5 rounded text-[10px] font-mono font-semibold tracking-wide text-amber-400 border border-amber-500/30">
          USO EXCLUSIVO INTERNO
        </div>
      </div>

      {/* Navigation menu */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-tab-${item.id}`}
              onClick={() => setActiveTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors font-sans ${
                isActive 
                  ? 'bg-[#1b365d] text-white font-semibold border-l-2 border-emerald-400' 
                  : 'text-[#87a0cd] hover:bg-[#1b365d]/40 hover:text-white'
              }`}
            >
              <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-[#87a0cd]'}`} />
              {item.label}
            </button>
          );
        })}
      </nav>

      {/* Footer System Status */}
      <div className="p-4 border-t border-[#1b365d]/50 bg-[#00142e] text-[11px] text-[#87a0cd] font-mono space-y-2">
        <div className="flex items-center justify-between">
          <span>Servidor Ingress:</span>
          <span className="text-emerald-400 font-semibold flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse"></span>
            Ativo (3000)
          </span>
        </div>
        <div className="flex items-center justify-between">
          <span>Agente Foundry:</span>
          {isLocal ? (
            <span className="text-amber-400 font-semibold">Local (Fallback)</span>
          ) : (
            <span className="text-emerald-400 font-semibold">Conectado (Cloud)</span>
          )}
        </div>
        <div className="flex items-center justify-between pt-1 border-t border-[#1b365d]/30 text-[10px]">
          <span>Versão do Protocolo:</span>
          <span>v2.1 (ANTT 5947)</span>
        </div>
      </div>
    </div>
  );
}
