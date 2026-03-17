/**
 * VeloHub V3 - KeywordFilter (Sociais)
 * VERSION: v1.0.0 | DATE: 2026-03-17 | AUTHOR: VeloHub Development Team
 */

import { useState, useEffect, useRef } from 'react';

const KeywordFilter = ({ value, onChange, options = [], placeholder = 'Digite ou selecione uma palavra' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value || '');
  const [filteredOptions, setFilteredOptions] = useState(options);
  const wrapperRef = useRef(null);
  const debounceTimerRef = useRef(null);
  const limitedOptions = options.slice(0, 20);

  useEffect(() => { setInputValue(value || ''); }, [value]);
  useEffect(() => {
    if (inputValue.trim() === '') setFilteredOptions(limitedOptions);
    else {
      const searchTerm = inputValue.toLowerCase();
      setFilteredOptions(limitedOptions.filter(opt => opt.toLowerCase().includes(searchTerm)));
    }
  }, [inputValue, options]);
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) setIsOpen(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  useEffect(() => () => { if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current); }, []);

  const handleInputChange = (e) => {
    const newValue = e.target.value;
    setInputValue(newValue);
    setIsOpen(true);
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    debounceTimerRef.current = setTimeout(() => { if (onChange) onChange(newValue); }, 300);
  };
  const handleOptionSelect = (option) => {
    setInputValue(option);
    setIsOpen(false);
    if (onChange) onChange(option);
  };
  const handleKeyDown = (e) => {
    if (e.key === 'Escape') setIsOpen(false);
    else if (e.key === 'Enter' && filteredOptions.length > 0 && isOpen) handleOptionSelect(filteredOptions[0]);
  };
  const isFromWordCloud = value && limitedOptions.includes(value);

  return (
    <div ref={wrapperRef} style={{ position: 'relative', flex: 1 }}>
      <div style={{ position: 'relative' }}>
        <input
          type="text"
          value={inputValue}
          onChange={handleInputChange}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          className="velohub-input"
          style={{ width: '100%', paddingRight: isFromWordCloud ? '30px' : '10px' }}
        />
        {isFromWordCloud && (
          <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', fontSize: '12px', color: '#1634FF', fontWeight: 'bold', pointerEvents: 'none' }} title="Palavra da Nuvem">☁️</span>
        )}
      </div>
      {isOpen && filteredOptions.length > 0 && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, backgroundColor: '#1e2130', border: '1px solid #2d3142', borderRadius: '4px', marginTop: '4px', maxHeight: '200px', overflowY: 'auto', zIndex: 1000, boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
          {filteredOptions.map((option, index) => (
            <div
              key={index}
              onClick={() => handleOptionSelect(option)}
              style={{
                padding: '10px 15px',
                cursor: 'pointer',
                borderBottom: index < filteredOptions.length - 1 ? '1px solid #2d3142' : 'none',
                backgroundColor: inputValue === option ? '#1634FF' : 'transparent',
                color: inputValue === option ? '#fff' : '#e0e0e0'
              }}
            >
              {option}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default KeywordFilter;
