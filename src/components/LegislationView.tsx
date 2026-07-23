/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Search, BookOpen, ChevronRight, FileText, Scale } from 'lucide-react';
import { LEGISLATION_DATABASE, LegislationItem } from '../data';

export default function LegislationView() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedItem, setSelectedItem] = useState<LegislationItem>(LEGISLATION_DATABASE[0]);

  const filteredLegislation = LEGISLATION_DATABASE.filter(
    (item) =>
      item.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="flex-1 p-8 flex flex-col overflow-hidden h-full" id="legislation-workspace">
      {/* Search Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#002046] mb-2 font-sans flex items-center gap-2">
          <BookOpen className="w-5 h-5 text-[#1b365d]" />
          Base Legal e Regulamentações Brasileiras
        </h1>
        <p className="text-xs text-gray-500 max-w-3xl leading-relaxed">
          Consulte o arcabouço normativo para o transporte rodoviário de cargas de resíduos de serviços de saúde (RSS) e produtos perigosos regulados pela ANTT e ANVISA.
        </p>

        {/* Search input */}
        <div className="mt-4 relative max-w-md">
          <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          <input
            type="text"
            placeholder="Buscar por resolução, norma, palavra-chave..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-white border border-[#eceef0] rounded-lg text-sm text-[#191c1e] placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-[#002046] focus:border-transparent font-sans"
          />
        </div>
      </div>

      {/* Grid splitscreen */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-hidden">
        {/* Left Side: List */}
        <div className="md:col-span-1 bg-white border border-[#eceef0] rounded-xl overflow-y-auto flex flex-col h-full shadow-sm">
          <div className="p-3 bg-[#eceef0]/30 border-b border-[#eceef0]">
            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider font-sans">Normatizações Ativas ({filteredLegislation.length})</span>
          </div>
          <div className="divide-y divide-[#eceef0] flex-1">
            {filteredLegislation.map((item) => {
              const isSelected = selectedItem.id === item.id;
              return (
                <button
                  key={item.id}
                  id={`legis-btn-${item.id}`}
                  onClick={() => setSelectedItem(item)}
                  className={`w-full p-4 text-left transition-colors flex items-start gap-3 hover:bg-[#eceef0]/20 ${
                    isSelected ? 'bg-[#eceef0]/50 border-l-4 border-[#002046]' : ''
                  }`}
                >
                  <FileText className={`w-5 h-5 mt-0.5 ${isSelected ? 'text-[#002046]' : 'text-gray-400'}`} />
                  <div className="flex-1">
                    <h3 className="text-xs font-mono font-bold text-gray-900">{item.code}</h3>
                    <p className="text-xs font-semibold text-[#002046] line-clamp-1 mt-0.5 font-sans">{item.title}</p>
                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[10px] bg-[#eceef0] text-gray-600 px-1.5 py-0.5 rounded font-medium">{item.scope}</span>
                      <ChevronRight className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  </div>
                </button>
              );
            })}
            {filteredLegislation.length === 0 && (
              <div className="p-8 text-center text-gray-400 text-xs">
                Nenhum regulamento encontrado para a busca atual.
              </div>
            )}
          </div>
        </div>

        {/* Right Side: Details pane */}
        <div className="md:col-span-2 bg-white border border-[#eceef0] rounded-xl overflow-y-auto h-full p-6 flex flex-col shadow-sm">
          <div className="border-b border-[#eceef0] pb-4 mb-4">
            <span className="text-[10px] font-mono font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded">{selectedItem.scope}</span>
            <h2 className="text-base font-bold text-[#002046] mt-2 font-mono">{selectedItem.code}</h2>
            <h3 className="text-sm font-semibold text-gray-700 mt-1 font-sans">{selectedItem.title}</h3>
          </div>

          <div className="space-y-6 flex-1">
            {/* Description */}
            <div>
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 font-sans">Visão Geral do Escopo</h4>
              <p className="text-xs text-gray-600 leading-relaxed font-sans">{selectedItem.description}</p>
            </div>

            {/* Practical requirements */}
            <div>
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 font-sans">Principais Exigências Operacionais</h4>
              <ul className="space-y-2">
                {selectedItem.details.map((detail, idx) => (
                  <li key={idx} className="text-xs text-gray-600 flex items-start gap-2 leading-relaxed">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#002046] mt-1.5 shrink-0"></span>
                    <span className="font-sans">{detail}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Articles */}
            <div>
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-3 font-sans flex items-center gap-1">
                <Scale className="w-3.5 h-3.5 text-gray-400" />
                Artigos Chave e Transcrições Regulatórias
              </h4>
              <div className="space-y-3">
                {selectedItem.keyArticles.map((art, idx) => (
                  <div key={idx} className="bg-[#eceef0]/30 border border-[#eceef0] p-3 rounded-lg">
                    <span className="text-[11px] font-mono font-bold text-[#002046] bg-white border border-[#eceef0] px-1.5 py-0.5 rounded">
                      {art.article}
                    </span>
                    <p className="text-xs text-gray-600 mt-2 italic leading-relaxed font-sans">
                      "{art.text}"
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
