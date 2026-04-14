import React from 'react';

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <i className="fas fa-times" style={{ cursor: 'pointer', fontSize: '24px' }} onClick={onClose}></i>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;