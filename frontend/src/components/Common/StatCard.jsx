import React from 'react';

const StatCard = ({ icon, iconColor, value, label, bgColor }) => {
  return (
    <div className="stat-card">
      <div className="stat-icon" style={{ background: bgColor || `${iconColor}20`, color: iconColor }}>
        <i className={`fas ${icon}`}></i>
      </div>
      <h3>{value}</h3>
      <p>{label}</p>
    </div>
  );
};

export default StatCard;