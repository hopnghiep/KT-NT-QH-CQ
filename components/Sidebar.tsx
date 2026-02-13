
import React from 'react';
import type { ActiveTab } from '../types';
import { useLanguage } from '../contexts/LanguageContext';
import { useTheme } from '../contexts/ThemeContext';
import { MainCategory } from './TopNav';

interface SidebarProps {
  activeTab: ActiveTab;
  onTabChange: (tab: ActiveTab) => void;
  activeCategory: MainCategory;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, onTabChange, activeCategory }) => {
  const { t } = useLanguage();
  const { theme } = useTheme();

  const getMenuContent = () => {
    switch (activeCategory) {
      case 'visual':
        return [
          { type: 'header', label: 'MÔ HÌNH TĨNH (STATIC RENDER)', isSpecial: true },
          { id: 'create', label: 'PHỐI CẢNH TỪ SƠ PHÁC (SKETCH TO RENDER)' },
          { id: 'landscape', label: 'PHỐI CẢNH CẢNH QUAN (LANDSCAPE)' },
          { id: 'sectionTo3d', label: 'TẠO MẶT CẮT KHÔNG GIAN TỪ 2D PLAN' },
          { id: 'cameraAngle', label: 'ĐA DẠNG GÓC NHÌN (CAMERA ANGLES)' },
          { id: 'blueprint', label: 'BẢN VẼ KỸ THUẬT (TECHNICAL BLUEPRINT)' },
          { id: 'creativeFusion', label: 'HÒA TRỘN PHONG CÁCH (STYLE FUSION)' },
          { id: 'changeStyle', label: 'ĐỔI PHONG CÁCH (CHANGE STYLE)' },
          { id: 'extendView', label: 'MỞ RỘNG GÓC NHÌN (OUTPAINTING)' },
          { id: 'lighting', label: 'THIẾT LẬP ÁNH SÁNG' },
          { id: 'photoToSketch', label: 'ẢNH CHỤP SANG PHÁC THẢO' },
          { type: 'header', label: 'MÔ HÌNH ĐỘNG (DYNAMIC RENDER)', isSpecial: true },
          { id: 'video', label: 'TẠO PHIM KIẾN TRÚC' },
          { id: 'virtualTour', label: 'THAM QUAN ẢO' },
        ];
      case 'design':
        return [
          { type: 'header', label: 'QUY TRÌNH THIẾT KẾ' },
          { id: 'standards', label: 'TIÊU CHUẨN THIẾT KẾ (STANDARDS)' },
          { id: 'designMission', label: 'THIẾT KẾ MẶT BẰNG TỪ YÊU CẦU THIẾT KẾ' },
          { id: 'floorPlan', label: 'THIẾT KẾ MẶT BẰNG CHUYÊN SÂU THEO MÔ HÌNH THÁP CÔNG NĂNG' },
          { id: 'planToPerspectiveDesign', label: 'TẠO PHỐI CẢNH TỪ 2D PLAN' },
          { id: 'planToElevation', label: 'TẠO MẶT ĐỨNG TỪ 2D PLAN' },
          { id: 'sectionTo3d', label: 'TẠO MẶT CẮT KHÔNG GIAN TỪ 2D PLAN' },
          { id: 'blueprint', label: 'TẠO BẢN VẼ KỸ THUẬT TỪ PHỐI CẢNH' },
        ];
      case 'adjust':
        return [
          { type: 'header', label: 'CHỈNH SỬA CHUYÊN SÂU' },
          { id: 'edit', label: 'SỬA VÙNG CHỌN (INPAINTING)' },
          { id: 'smartEdit', label: 'CHỈNH SỬA THÔNG MINH' },
          { id: 'mergeHouse', label: 'GHÉP NHÀ (MERGE BUILDING)' },
          { id: 'mergeMaterial', label: 'THAY VẬT LIỆU (CHANGE MATERIAL)' },
          { id: 'mergeFurniture', label: 'THAY NỘI THẤT (REPLACE FURNITURE)' },
          { id: 'canva', label: 'CANVA MIX (GHÉP ĐỒ RỜI)' },
        ];
      case 'utilities':
        return [
          { type: 'header', label: 'CÔNG CỤ HỖ TRỢ' },
          { id: 'prompt', label: 'TẠO PROMPT TỪ ẢNH' },
          { id: 'library', label: 'THƯ VIỆN CỦA TÔI' },
        ];
      case 'fengshui':
        return [
          { type: 'header', label: 'PHONG THỦY' },
          { id: 'fengShui', label: 'TƯ VẤN PHONG THỦY' },
        ];
      default:
        return [];
    }
  };

  const menuItems = getMenuContent();

  return (
    <aside className="w-full h-full flex flex-col bg-[#161616] border-r border-white/5 overflow-y-auto thin-scrollbar">
      <div className="p-4 flex flex-col gap-1">
        {menuItems.map((item: any, idx) => {
          if (item.type === 'header') {
            return (
              <div 
                key={idx} 
                className={`px-4 py-4 text-[11px] font-black ${item.isSpecial ? 'text-amber-500' : 'text-slate-500'} uppercase tracking-widest mt-4 first:mt-0`}
              >
                {item.label}
              </div>
            );
          }
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full text-left px-4 py-3.5 rounded-xl text-[10px] font-black uppercase tracking-tighter transition-all ${
                isActive
                  ? 'bg-orange-600/20 text-orange-400 border border-orange-500/30'
                  : 'text-slate-400 hover:text-slate-100 hover:bg-white/5 border border-transparent'
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </aside>
  );
};
