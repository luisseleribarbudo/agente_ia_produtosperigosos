/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { ShieldAlert, Info, AlertTriangle, CheckCircle } from 'lucide-react';
import { HAZMAT_CLASSES, HazmatClassItem } from '../data';

export default function HazmatClassesView() {
  const [selectedClass, setSelectedClass] = useState<HazmatClassItem>(HAZMAT_CLASSES[5]); // Default to Class 6 (Toxics/Infectants)

  return (
    <div className="flex-1 p-8 flex flex-col overflow-hidden h-full" id="hazmat-workspace">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-xl font-bold text-[#002046] mb-2 font-sans flex items-center gap-2">
          <ShieldAlert className="w-5 h-5 text-[#1b365d]" />
          Classes de Riscos e Produtos Perigosos
        </h1>
        <p className="text-xs text-gray-500 max-w-3xl leading-relaxed">
          Guia de referência das 9 Classes de Riscos regulamentadas pela ANTT para fins de sinalização, compatibilidade química de carregamento conjunto e segregação física no compartimento de carga.
        </p>
      </div>

      {/* Main Grid Splitting */}
      <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-6 overflow-hidden">
        {/* Left Grid: 3x3 Card Grid for Hazmat Classes (spanning 5 columns) */}
        <div className="md:col-span-5 bg-white border border-[#eceef0] rounded-xl p-4 overflow-y-auto h-full shadow-sm">
          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block mb-3 font-sans">Selecione uma Classe de Perigo</span>
          <div className="grid grid-cols-3 gap-3">
            {HAZMAT_CLASSES.map((item) => {
              const isSelected = selectedClass.id === item.id;
              return (
                <button
                  key={item.id}
                  id={`hazmat-btn-${item.classNumber}`}
                  onClick={() => setSelectedClass(item)}
                  style={{
                    backgroundColor: isSelected ? item.color : 'transparent',
                    color: isSelected ? item.textColor : '#191c1e',
                  }}
                  className={`aspect-square border p-3 flex flex-col items-center justify-between rounded-lg transition-all text-center hover:scale-[1.02] cursor-pointer ${
                    isSelected 
                      ? 'border-transparent shadow-md' 
                      : 'border-[#eceef0] hover:bg-[#eceef0]/30'
                  }`}
                >
                  <div className="w-8 h-8 rounded flex items-center justify-center font-mono text-base font-bold bg-black/10 border border-black/10">
                    {item.classNumber}
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-tight line-clamp-2 leading-tight font-sans">
                    {item.name}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Section: Detailed Class Information (spanning 7 columns) */}
        <div className="md:col-span-7 bg-white border border-[#eceef0] rounded-xl p-6 overflow-y-auto h-full flex flex-col shadow-sm">
          {/* Class Header Banner */}
          <div 
            style={{ backgroundColor: selectedClass.color, color: selectedClass.textColor }}
            className="p-5 rounded-lg flex items-center justify-between mb-5 shadow-inner"
          >
            <div>
              <span className="text-[10px] font-bold tracking-widest font-mono opacity-80 uppercase">CLASSE DE RISCO {selectedClass.classNumber}</span>
              <h2 className="text-lg font-bold font-sans mt-0.5">{selectedClass.name}</h2>
            </div>
            <div className="w-14 h-14 rounded-md border border-white/20 bg-black/10 flex items-center justify-center font-mono text-3xl font-extrabold">
              {selectedClass.classNumber}
            </div>
          </div>

          <div className="space-y-5 flex-1">
            {/* Description */}
            <div>
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1 font-sans">
                <Info className="w-3.5 h-3.5 text-gray-400" />
                Definição Legal
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed font-sans">{selectedClass.description}</p>
            </div>

            {/* Subclasses */}
            <div>
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 font-sans">Subdivisões e Categorias</h4>
              <div className="flex flex-wrap gap-2">
                {selectedClass.subClasses.map((sub, idx) => (
                  <span key={idx} className="text-[10px] font-mono bg-[#eceef0] text-[#191c1e] px-2 py-1 rounded font-medium">
                    {sub}
                  </span>
                ))}
              </div>
            </div>

            {/* Handling precautions */}
            <div>
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-2 flex items-center gap-1 font-sans">
                <AlertTriangle className="w-3.5 h-3.5 text-amber-500" />
                Precauções Especiais de Movimentação e Manuseio
              </h4>
              <ul className="space-y-2">
                {selectedClass.handlingPrecautions.map((prec, idx) => (
                  <li key={idx} className="text-xs text-gray-600 flex items-start gap-2 bg-amber-50/50 border border-amber-200/40 p-2 rounded-md font-sans">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-500 mt-1.5 shrink-0"></span>
                    <span>{prec}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Packaging specifications */}
            <div className="border-t border-[#eceef0] pt-4">
              <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wider mb-1 flex items-center gap-1 font-sans">
                <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                Regulamentação de Acondicionamento / Embalagem
              </h4>
              <p className="text-xs text-gray-600 leading-relaxed font-sans">{selectedClass.packagingRequirements}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
