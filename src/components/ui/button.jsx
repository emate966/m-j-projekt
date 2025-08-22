import React from 'react';

const Button = ({ children, onClick }) => {
  return (
    <button 
      onClick={onClick} 
      style={{
        padding: '8px 16px',
        backgroundColor: '#007bff',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        cursor: 'pointer'
      }}
    >
      {children}
    </button>
  );
};

export default Button;
