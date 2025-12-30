'use client';

import { useEffect, useRef, useState } from 'react';
import './ContextMenu.css';

interface ContextMenuProps {
  x: number;
  y: number;
  items: Array<{ label: string; action: string }>;
  onSelect: (action: string) => void;
  onClose: () => void;
}

// 메뉴 크기 상수 (아이템 3개 기준)
const MENU_WIDTH = 220;
const MENU_HEIGHT = 150;
const PADDING = 10;

// 위치 계산 함수
function calculatePosition(x: number, y: number, width: number, height: number) {
  let finalX = x;
  let finalY = y;

  // 오른쪽 끝이 화면을 벗어나면 왼쪽으로 정렬
  if (x + width > window.innerWidth) {
    finalX = window.innerWidth - width - PADDING;
  }

  // 아래쪽이 화면을 벗어나면 위로 정렬
  if (y + height > window.innerHeight) {
    finalY = window.innerHeight - height - PADDING;
  }

  return {
    x: Math.max(PADDING, finalX),
    y: Math.max(PADDING, finalY),
  };
}

export default function ContextMenu({ x, y, items, onSelect, onClose }: ContextMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState(() => calculatePosition(x, y, MENU_WIDTH, MENU_HEIGHT));

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    // Esc 키로도 닫기
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  // 위치 업데이트 (초기값이 아닌 경우)
  useEffect(() => {
    const newPosition = calculatePosition(x, y, MENU_WIDTH, MENU_HEIGHT);
    setPosition(newPosition);
  }, [x, y]);

  return (
    <div
      ref={menuRef}
      className="context-menu"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
      }}
    >
      {items.map((item) => (
        <div
          key={item.action}
          className="context-menu-item"
          onClick={() => {
            onSelect(item.action);
            onClose();
          }}
        >
          {item.label}
        </div>
      ))}
    </div>
  );
}
