/**
 * Utilitários para manipulação de timestamps
 * VERSION: v1.0.0 | DATE: 2025-01-31 | AUTHOR: VeloHub Development Team
 * 
 * Funções para obter timestamps em diferentes formatos
 */

/**
 * Retorna o timestamp atual como objeto Date
 * @returns {Date} Data atual
 */
function getCurrentTimestamp() {
  return new Date();
}

/**
 * Retorna o timestamp atual como string ISO
 * @returns {string} Data atual no formato ISO 8601
 */
function getCurrentTimestampISO() {
  return new Date().toISOString();
}

module.exports = {
  getCurrentTimestamp,
  getCurrentTimestampISO
};

