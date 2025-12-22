'use client'

import { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';
import './Breadcrumb.css';

interface BreadcrumbItem {
  title: string;
  onClick: () => void;
  level?: number; // 1, 2, 3, ... 또는 undefined for "현재"
  isCurrent?: boolean;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

export default function Breadcrumb({ items }: BreadcrumbProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // 현재 항목 찾기
  const currentItem = items.find(item => item.isCurrent);

  // 외부 클릭 감지하여 드롭다운 닫기
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  return (
    <div className="breadcrumb-dropdown" ref={dropdownRef}>
      <button
        className="breadcrumb-toggle"
        onClick={() => setIsOpen(!isOpen)}
        title={currentItem?.title || '네비게이션'}
      >
        <ChevronDown size={16} style={{ marginRight: '6px' }} />
        <span className="breadcrumb-toggle-text">
          {currentItem?.title || '검색결과'}
        </span>
      </button>

      {isOpen && (
        <div className="breadcrumb-menu">
          {items.map((item, index) => (
            <button
              key={index}
              className={`breadcrumb-menu-item ${item.isCurrent ? 'current' : ''}`}
              onClick={() => {
                item.onClick();
                setIsOpen(false);
              }}
              title={item.title}
            >
              {item.level ? `<${item.level}단계> ` : ''}
              <span className="breadcrumb-menu-item-text">{item.title}</span>
              {item.isCurrent && <span className="breadcrumb-current-marker">✓</span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
