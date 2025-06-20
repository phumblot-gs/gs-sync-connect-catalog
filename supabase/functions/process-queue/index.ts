import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Récupérer les jobs en attente
    const { data: pendingJobs, error: fetchError } = await supabase
      .from('processing_queue')
      .select(`
        *,
        synchronizations (
          *,
          principal_account:grand_shooting_accounts!principal_account_id(*),
          secondary_account:grand_shooting_accounts!secondary_account_id(*)
        )
      `)
      .eq('status', 'pending')
      .limit(10)

    if (fetchError) {
      throw new Error(`Erreur lors de la récupération des jobs: ${fetchError.message}`)
    }

    if (!pendingJobs || pendingJobs.length === 0) {
      return new Response(
        JSON.stringify({ message: 'Aucun job en attente', processed: 0 }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    let processedCount = 0
    const errors: string[] = []

    // Traiter chaque job
    for (const job of pendingJobs) {
      try {
        // Marquer le job comme en cours de traitement
        await supabase
          .from('processing_queue')
          .update({ status: 'processing' })
          .eq('id', job.id)

        // Simuler le traitement (à remplacer par l'appel au microservice)
        console.log(`Traitement du job ${job.id} de type ${job.job_type}`)
        
        // TODO: Appeler le microservice de synchronisation
        // const response = await fetch('http://localhost:3001/process', {
        //   method: 'POST',
        //   headers: { 'Content-Type': 'application/json' },
        //   body: JSON.stringify(job)
        // })

        // Pour l'instant, marquer comme terminé
        await supabase
          .from('processing_queue')
          .update({ 
            status: 'completed',
            processed_at: new Date().toISOString()
          })
          .eq('id', job.id)

        // Logger le succès
        await supabase
          .from('sync_logs')
          .insert({
            sync_id: job.sync_id,
            log_type: 'info',
            message: `Job ${job.job_type} traité avec succès`,
            metadata: { job_id: job.id }
          })

        processedCount++

      } catch (jobError) {
        console.error(`Erreur lors du traitement du job ${job.id}:`, jobError)
        
        // Marquer le job comme échoué
        await supabase
          .from('processing_queue')
          .update({ 
            status: 'failed',
            error_message: jobError.message,
            attempts: job.attempts + 1
          })
          .eq('id', job.id)

        // Logger l'erreur
        await supabase
          .from('sync_logs')
          .insert({
            sync_id: job.sync_id,
            log_type: 'error',
            message: `Erreur lors du traitement du job: ${jobError.message}`,
            metadata: { job_id: job.id, job_type: job.job_type }
          })

        errors.push(`Job ${job.id}: ${jobError.message}`)
      }
    }

    return new Response(
      JSON.stringify({ 
        processed: processedCount,
        errors: errors.length > 0 ? errors : undefined
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erreur générale:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
}) 