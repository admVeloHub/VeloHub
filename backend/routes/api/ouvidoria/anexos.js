/**
 * VeloHub V3 - Ouvidoria API Routes - Anexos
 * VERSION: v1.1.0 | DATE: 2026-04-22 | AUTHOR: VeloHub Development Team
 *
 * Mudanças v1.1.0:
 * - Email do uploader: somente a partir de req.user (sessão ouvidoriaAccess); header/body divergente → 403
 *
 * Rotas para upload de anexos de reclamações para Google Cloud Storage
 */

const express = require('express');
const router = express.Router();
const { Storage } = require('@google-cloud/storage');
const multer = require('multer');

// Configurar multer para armazenar arquivos em memória
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB máximo
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = /\.(pdf|doc|docx|jpg|jpeg|png)$/i;
    if (allowedTypes.test(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Tipo de arquivo não permitido. Use PDF, DOC, DOCX, JPG, JPEG ou PNG'));
    }
  }
});

/**
 * Inicializar rotas de anexos
 * @param {Object} client - MongoDB client (não usado aqui, mas mantido para consistência)
 * @param {Function} connectToMongo - Função para conectar ao MongoDB (não usado aqui)
 * @param {Object} services - Serviços disponíveis
 */
const initAnexosRoutes = (client, connectToMongo, services = {}) => {
  /**
   * POST /api/ouvidoria/anexos/upload
   * Upload de anexo para Google Cloud Storage
   */
  router.post('/upload', upload.single('anexo'), async (req, res) => {
    try {
      const tipo = req.body?.tipo || 'BACEN';

      if (!req.file) {
        return res.status(400).json({
          success: false,
          error: 'Arquivo não fornecido'
        });
      }

      const sessionEmail = (req.user && req.user.email) ? String(req.user.email).trim() : '';
      if (!sessionEmail) {
        return res.status(400).json({
          success: false,
          error: 'Email do usuário não disponível na sessão'
        });
      }

      const headerOrBody = (req.headers['x-user-email'] || req.body?.userEmail || '').toString().trim();
      if (headerOrBody) {
        const a = sessionEmail.toLowerCase();
        const b = headerOrBody.toLowerCase();
        if (a !== b) {
          return res.status(403).json({
            success: false,
            error: 'Email informado não confere com a sessão'
          });
        }
      }

      const userEmail = sessionEmail;

      // Preparar nome do arquivo: timestamp-originalname
      const timestamp = Date.now();
      const sanitizedFileName = req.file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const fileName = `${timestamp}-${sanitizedFileName}`;
      const filePath = `anexos_ouvidoria/${tipo.toLowerCase()}/${fileName}`;

      // Inicializar Google Cloud Storage
      const bucketName = process.env.GCS_BUCKET_NAME2 || 'mediabank_velohub';
      
      let storage;
      try {
        const googleCredentials = process.env.GOOGLE_CREDENTIALS;
        const gcpProjectId = process.env.GCP_PROJECT_ID;
        
        if (!gcpProjectId || gcpProjectId === 'your-gcp-project-id') {
          console.error('❌ GCP_PROJECT_ID não está definido ou está com valor placeholder');
          return res.status(500).json({
            success: false,
            error: 'GCP_PROJECT_ID não configurado. Verifique o arquivo backend/env'
          });
        }
        
        if (googleCredentials) {
          if (googleCredentials.trim().startsWith('{') || googleCredentials.trim().startsWith('[')) {
            try {
              const credentials = JSON.parse(googleCredentials);
              
              if (credentials.project_id === 'your-project-id' || 
                  credentials.private_key === '-----BEGIN PRIVATE KEY-----
REDACTED
-----END PRIVATE KEY-----\n' ||
                  credentials.private_key?.includes('...')) {
                console.error('❌ GOOGLE_CREDENTIALS contém valores placeholder');
                return res.status(500).json({
                  success: false,
                  error: 'Credenciais do Google Cloud não configuradas. Verifique o arquivo backend/env'
                });
              }
              
              if (credentials.private_key) {
                credentials.private_key = credentials.private_key.replace(/\\n/g, '\n');
              }
              
              storage = new Storage({
                projectId: gcpProjectId,
                credentials: credentials
              });
            } catch (parseError) {
              console.error('❌ Erro ao fazer parse das credenciais JSON:', parseError);
              storage = new Storage({
                projectId: gcpProjectId,
                keyFilename: googleCredentials
              });
            }
          } else {
            storage = new Storage({
              projectId: gcpProjectId,
              keyFilename: googleCredentials
            });
          }
        } else {
          console.error('❌ GOOGLE_CREDENTIALS não está definido');
          return res.status(500).json({
            success: false,
            error: 'GOOGLE_CREDENTIALS não configurado. Verifique o arquivo backend/env'
          });
        }
      } catch (error) {
        console.error('❌ Erro ao inicializar Storage:', error);
        return res.status(500).json({
          success: false,
          error: 'Erro ao inicializar Google Cloud Storage',
          details: process.env.NODE_ENV === 'development' ? error.message : undefined
        });
      }

      const bucket = storage.bucket(bucketName);
      const blob = bucket.file(filePath);

      // Determinar content type
      const contentType = req.file.mimetype || 'application/octet-stream';

      // Upload do arquivo
      await new Promise((resolve, reject) => {
        const stream = blob.createWriteStream({
          metadata: {
            contentType: contentType,
            metadata: {
              originalName: req.file.originalname,
              uploadedBy: userEmail,
              uploadedAt: new Date().toISOString(),
              tipo: tipo
            }
          }
        });

        stream.on('error', (error) => {
          console.error('❌ Erro ao fazer upload:', error);
          reject(error);
        });

        stream.on('finish', () => {
          resolve();
        });

        stream.end(req.file.buffer);
      });

      // Obter URL pública
      const publicUrl = `https://storage.googleapis.com/${bucketName}/${filePath}`;

      console.log(`✅ Anexo enviado com sucesso: ${fileName}`);
      console.log(`📎 URL: ${publicUrl}`);

      res.json({
        success: true,
        url: publicUrl,
        fileName: req.file.originalname,
        filePath: filePath,
        message: 'Anexo enviado com sucesso'
      });

    } catch (error) {
      console.error('❌ Erro ao fazer upload do anexo:', error);
      console.error('Stack:', error.stack);
      res.status(500).json({
        success: false,
        error: 'Erro ao fazer upload do anexo',
        details: process.env.NODE_ENV === 'development' ? error.message : undefined
      });
    }
  });

  return router;
};

module.exports = initAnexosRoutes;
