/**
 * VeloHub V3 — Widget genérico da sidebar direita (Home)
 * VERSION: v1.0.0 | DATE: 2026-05-26 | AUTHOR: VeloHub Development Team
 */

import React from 'react';
import HomeWidgetTitle from './HomeWidgetTitle';

const HomeSidebarWidget = ({ titleFile, titleAlt, className = '', children }) => (
  <div className={`home-widget home-sidebar-widget ${className}`.trim()}>
    <HomeWidgetTitle fileName={titleFile} alt={titleAlt} />
    <div className="home-sidebar-widget__body">{children}</div>
  </div>
);

export default HomeSidebarWidget;
