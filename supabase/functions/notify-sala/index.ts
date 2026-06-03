import webpush from 'npm:web-push@3.6.7'
import { createClient } from 'npm:@supabase/supabase-js@2'

const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY')!
const VAPID_PUBLIC_KEY = Deno.env.get('VAPID_PUBLIC_KEY')!
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

webpush.setVapidDetails(
  'mailto:antonio.sanchez@kaleris.com',
  VAPID_PUBLIC_KEY,
  VAPID_PRIVATE_KEY
)

Deno.serve(async (req) => {
  let payload: { record: { desk_id: string; date: string; user_name: string } }

  try {
    payload = await req.json()
  } catch {
    return new Response('Invalid JSON', { status: 400 })
  }

  const { desk_id, date, user_name } = payload.record

  if (!desk_id.toUpperCase().includes('SALA')) {
    return new Response('Not a SALA desk', { status: 200 })
  }

  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY)

  const { data: subscriptions } = await supabase
    .from('push_subscriptions')
    .select('endpoint, p256dh, auth')
    .eq('email', 'sevdapinar.coskun@kaleris.com')

  if (!subscriptions || subscriptions.length === 0) {
    return new Response('No subscriptions', { status: 200 })
  }

  const notificationPayload = JSON.stringify({
    title: 'SALA reservation',
    body: `Desk ${desk_id} booked for ${date} by ${user_name}`,
  })

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      const pushSubscription = {
        endpoint: sub.endpoint,
        keys: { p256dh: sub.p256dh, auth: sub.auth },
      }
      try {
        await webpush.sendNotification(pushSubscription, notificationPayload)
      } catch (err: any) {
        if (err.statusCode === 410) {
          await supabase
            .from('push_subscriptions')
            .delete()
            .eq('endpoint', sub.endpoint)
        }
      }
    })
  )

  return new Response('Notifications sent', { status: 200 })
})
