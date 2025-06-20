const express = require('express')
const cors = require('cors')
const helmet = require('helmet')
const morgan = require('morgan')
require('dotenv').config()

const app = express()
const PORT = process.env.PORT || 3000

// Middleware
app.use(helmet())
app.use(cors())
app.use(morgan('combined'))
app.use(express.json({ limit: '10mb' }))

// Routes
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'sync-service',
    timestamp: new Date().toISOString()
  })
})

app.post('/process', async (req, res) => {
  try {
    const { id, sync_id, job_type, payload } = req.body
    
    console.log(`Traitement du job ${id} de type ${job_type}`)
    
    // TODO: Implémenter la logique de synchronisation
    // - Récupérer la configuration de synchronisation
    // - Appeler l'API Grand Shooting
    // - Appliquer les transformations
    // - Mettre à jour le compte secondaire
    
    // Simulation du traitement
    await new Promise(resolve => setTimeout(resolve, 1000))
    
    res.json({
      success: true,
      job_id: id,
      message: `Job ${job_type} traité avec succès`
    })
    
  } catch (error) {
    console.error('Erreur lors du traitement:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

app.post('/sync/webhook', async (req, res) => {
  try {
    const { sync_id, data } = req.body
    
    console.log(`Webhook reçu pour la synchronisation ${sync_id}`)
    
    // TODO: Traiter le webhook
    // - Valider les données
    // - Créer un job dans la pile
    // - Retourner immédiatement
    
    res.json({
      success: true,
      message: 'Webhook reçu et traité'
    })
    
  } catch (error) {
    console.error('Erreur lors du traitement du webhook:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

app.post('/sync/batch', async (req, res) => {
  try {
    const { sync_id, since } = req.body
    
    console.log(`Synchronisation batch pour ${sync_id} depuis ${since}`)
    
    // TODO: Implémenter la synchronisation batch
    // - Récupérer les données depuis l'API Grand Shooting
    // - Créer des jobs pour chaque référence
    // - Retourner le nombre de jobs créés
    
    res.json({
      success: true,
      jobs_created: 0,
      message: 'Synchronisation batch initiée'
    })
    
  } catch (error) {
    console.error('Erreur lors de la synchronisation batch:', error)
    res.status(500).json({
      success: false,
      error: error.message
    })
  }
})

// Gestion des erreurs
app.use((err, req, res, next) => {
  console.error('Erreur non gérée:', err)
  res.status(500).json({
    success: false,
    error: 'Erreur interne du serveur'
  })
})

// Route 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Route non trouvée'
  })
})

app.listen(PORT, () => {
  console.log(`🚀 Sync Service démarré sur le port ${PORT}`)
  console.log(`📊 Health check: http://localhost:${PORT}/health`)
}) 