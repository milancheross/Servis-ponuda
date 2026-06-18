'use strict';

const express = require('express');
const { v4: uuidv4 } = require('uuid');
const supabase = require('../db');
const authMiddleware = require('../middleware/auth');
const { sendPushNotification } = require('../utils/notifications');
const { logEvent, logFirstEvent } = require('../utils/events');

const router = express.Router();

// ---------------------------------------------------------------------------
// PUBLIC route — must be registered BEFORE authMiddleware
// GET /quotes/track/:token — client-facing quote tracking
// ---------------------------------------------------------------------------
router.get('/track/:token', async (req, res, next) => {
  try {
    const { token } = req.params;

    const { data: quote, error } = await supabase
      .from('quotes')
      .select(`
        id, user_id, status, valid_until, discount_percent, note, total_amount,
        opened_at, sent_at, created_at,
        clients ( name, phone, email, address ),
        users ( company_name, logo_url, phone, address, expo_push_token )
      `)
      .eq('tracking_token', token)
      .maybeSingle();

    if (error) throw error;
    if (!quote) return res.status(404).json({ error: 'Quote not found' });

    // Fetch quote items
    const { data: items, error: itemsError } = await supabase
      .from('quote_items')
      .select('*')
      .eq('quote_id', quote.id);

    if (itemsError) throw itemsError;

    // If this is the first open, stamp opened_at and notify the tradesperson
    if (!quote.opened_at) {
      await supabase
        .from('quotes')
        .update({ opened_at: new Date().toISOString() })
        .eq('id', quote.id);

      await logEvent(quote.id, quote.user_id, 'quote_opened', {});
      await logFirstEvent(quote.user_id, 'first_quote_opened', {});

      // Use the already-joined users data (contains expo_push_token)
      const userData = quote.users;
      if (userData && userData.expo_push_token) {
        const clientName = quote.clients ? quote.clients.name : 'Klijent';
        await sendPushNotification(
          userData.expo_push_token,
          'Ponuda otvorena!',
          `${clientName} je upravo otvorio/la vašu ponudu.`
        );
      }
    }

    // Strip sensitive fields before returning to the public client
    const { expo_push_token: _tok, ...safeCompany } = quote.users || {};

    return res.json({
      quote: {
        id:               quote.id,
        status:           quote.status,
        valid_until:      quote.valid_until,
        discount_percent: quote.discount_percent,
        note:             quote.note,
        total_amount:     quote.total_amount,
        sent_at:          quote.sent_at,
        created_at:       quote.created_at,
        company:          safeCompany,
        client:           quote.clients,
        items,
      },
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// PUBLIC route — POST /quotes/track/:token/respond — client accepts/declines
// ---------------------------------------------------------------------------
router.post('/track/:token/respond', async (req, res, next) => {
  try {
    const { token } = req.params;
    const { accepted } = req.body;

    const { data: quote, error } = await supabase
      .from('quotes')
      .select('id, user_id, status, clients(name), users(expo_push_token)')
      .eq('tracking_token', token)
      .maybeSingle();

    if (error) throw error;
    if (!quote) return res.status(404).json({ error: 'Quote not found' });
    if (quote.status !== 'sent') {
      return res.status(409).json({ error: 'Quote already responded to' });
    }

    const newStatus = accepted ? 'accepted' : 'declined';
    await supabase.from('quotes').update({ status: newStatus }).eq('id', quote.id);

    await logEvent(quote.id, quote.user_id, accepted ? 'quote_accepted' : 'quote_declined', {});
    if (accepted) await logFirstEvent(quote.user_id, 'first_quote_accepted', {});

    const pushToken = quote.users?.expo_push_token;
    if (pushToken) {
      const clientName = quote.clients?.name || 'Klijent';
      const title = accepted ? '✅ Ponuda PRIHVAĆENA!' : '❌ Ponuda odbijena';
      const body = `${clientName} je ${accepted ? 'prihvatio/la' : 'odbio/la'} ponudu.`;
      await sendPushNotification(pushToken, title, body);
    }

    return res.json({ success: true, status: newStatus });
  } catch (err) {
    next(err);
  }
});

// All routes below require authentication
router.use(authMiddleware);

// ---------------------------------------------------------------------------
// POST /quotes/quick — TTFV: create client + quote + send in one request
// ---------------------------------------------------------------------------
router.post('/quick', async (req, res, next) => {
  try {
    const { client_name, client_phone, description, price } = req.body;

    if (!client_name || !description || !price) {
      return res.status(400).json({ error: 'client_name, description, and price are required' });
    }

    const parsedPrice = parseFloat(price);
    if (isNaN(parsedPrice) || parsedPrice <= 0) {
      return res.status(400).json({ error: 'price must be a positive number' });
    }

    // 1. Find or create client
    let clientId;
    if (client_phone) {
      const { data: existing } = await supabase
        .from('clients')
        .select('id')
        .eq('user_id', req.userId)
        .eq('phone', client_phone.trim())
        .maybeSingle();
      if (existing) {
        clientId = existing.id;
      }
    }

    if (!clientId) {
      const { data: newClient, error: clientErr } = await supabase
        .from('clients')
        .insert({ user_id: req.userId, name: client_name.trim(), phone: client_phone?.trim() || null })
        .select('id')
        .single();
      if (clientErr) throw clientErr;
      clientId = newClient.id;
    }

    // 2. Create quote with single item
    const item = { name: description.trim(), unit: 'paušal', quantity: 1, price: parsedPrice, total: parsedPrice };
    const trackingToken = uuidv4();

    const { data: quote, error: quoteErr } = await supabase
      .from('quotes')
      .insert({
        user_id: req.userId,
        client_id: clientId,
        status: 'sent',
        discount_percent: 0,
        total_amount: parsedPrice,
        tracking_token: trackingToken,
        sent_at: new Date().toISOString(),
      })
      .select('id')
      .single();
    if (quoteErr) throw quoteErr;

    // 3. Insert quote item
    await supabase.from('quote_items').insert({ ...item, quote_id: quote.id });

    // 4. Log events
    await logEvent(quote.id, req.userId, 'quote_created', { method: 'quick' });
    await logEvent(quote.id, req.userId, 'quote_sent', { method: 'quick' });
    await logFirstEvent(req.userId, 'first_quote_created', { method: 'quick' });
    await logFirstEvent(req.userId, 'first_quote_sent', { method: 'quick' });

    const trackingUrl = `${process.env.APP_URL || 'http://localhost:3000'}/q/${trackingToken}`;

    return res.status(201).json({
      quote_id: quote.id,
      tracking_url: trackingUrl,
      tracking_token: trackingToken,
      client_id: clientId,
    });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// Helper: calculate total from items and discount
// ---------------------------------------------------------------------------
function calcTotal(items, discountPercent) {
  const subtotal = items.reduce((sum, item) => sum + item.total, 0);
  const discount = discountPercent ? subtotal * (discountPercent / 100) : 0;
  return Math.max(0, subtotal - discount);
}

// ---------------------------------------------------------------------------
// GET /quotes — list all quotes for user with client name
// ---------------------------------------------------------------------------
router.get('/', async (req, res, next) => {
  try {
    const { status } = req.query;

    let query = supabase
      .from('quotes')
      .select(`
        id, status, valid_until, discount_percent, total_amount,
        sent_at, opened_at, created_at,
        clients ( id, name, phone, email )
      `)
      .eq('user_id', req.userId)
      .order('created_at', { ascending: false });

    if (status) query = query.eq('status', status);

    const { data, error } = await query;
    if (error) throw error;

    const normalized = (data || []).map(q => ({
      ...q,
      client_id: q.clients?.id ?? null,
      client: q.clients ?? null,
      total: q.total_amount,
      clients: undefined,
    }));

    return res.json({ quotes: normalized });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /quotes — create quote with items array
// ---------------------------------------------------------------------------
router.post('/', async (req, res, next) => {
  try {
    const {
      client_id, valid_until, discount_percent = 0,
      note, items = [],
    } = req.body;

    // Validate & normalise items
    const normalisedItems = items.map((item) => {
      const qty   = parseFloat(item.quantity) || 1;
      const price = parseFloat(item.price)    || 0;
      return {
        name:     item.name || '',
        unit:     item.unit || null,
        quantity: qty,
        price,
        total: parseFloat((qty * price).toFixed(2)),
      };
    });

    const total_amount = calcTotal(normalisedItems, parseFloat(discount_percent) || 0);

    // Insert quote
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .insert({
        user_id:          req.userId,
        client_id:        client_id || null,
        status:           'draft',
        valid_until:      valid_until || null,
        discount_percent: parseFloat(discount_percent) || 0,
        note:             note || null,
        total_amount,
      })
      .select('*')
      .single();

    if (quoteError) throw quoteError;

    // Insert items
    let insertedItems = [];
    if (normalisedItems.length > 0) {
      const { data: itemRows, error: itemError } = await supabase
        .from('quote_items')
        .insert(normalisedItems.map((i) => ({ ...i, quote_id: quote.id })))
        .select('*');

      if (itemError) throw itemError;
      insertedItems = itemRows;
    }

    await logEvent(quote.id, req.userId, 'quote_created', {});
    await logFirstEvent(req.userId, 'first_quote_created', { method: 'full' });

    return res.status(201).json({ quote: { ...quote, items: insertedItems } });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// GET /quotes/:id — get quote with items and client
// ---------------------------------------------------------------------------
router.get('/:id', async (req, res, next) => {
  try {
    const { data: quote, error } = await supabase
      .from('quotes')
      .select(`
        *,
        clients ( id, name, phone, email, address )
      `)
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .maybeSingle();

    if (error) throw error;
    if (!quote) return res.status(404).json({ error: 'Quote not found' });

    const { data: items, error: itemsError } = await supabase
      .from('quote_items')
      .select('*')
      .eq('quote_id', quote.id);

    if (itemsError) throw itemsError;

    const normalized = {
      ...quote,
      client_id: quote.clients?.id ?? quote.client_id ?? null,
      client: quote.clients ?? null,
      total: quote.total_amount,
      subtotal: quote.total_amount,
      discount_amount: 0,
      items: (items || []).map(i => ({ ...i, unit_price: i.price })),
      clients: undefined,
    };

    return res.json({ quote: normalized });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// PUT /quotes/:id — update quote (only while status='draft')
// ---------------------------------------------------------------------------
router.put('/:id', async (req, res, next) => {
  try {
    const { data: existing, error: fetchError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!existing) return res.status(404).json({ error: 'Quote not found' });
    if (existing.status !== 'draft') {
      return res.status(400).json({ error: 'Only draft quotes can be edited' });
    }

    const {
      client_id, valid_until, discount_percent,
      note, items,
    } = req.body;

    const updates = {};
    if (client_id        !== undefined) updates.client_id        = client_id;
    if (valid_until      !== undefined) updates.valid_until      = valid_until;
    if (discount_percent !== undefined) updates.discount_percent = parseFloat(discount_percent);
    if (note             !== undefined) updates.note             = note;

    // Recalculate total if items or discount changed
    let normalisedItems;
    if (items !== undefined) {
      normalisedItems = items.map((item) => {
        const qty   = parseFloat(item.quantity) || 1;
        const price = parseFloat(item.price)    || 0;
        return {
          name:     item.name || '',
          unit:     item.unit || null,
          quantity: qty,
          price,
          total: parseFloat((qty * price).toFixed(2)),
        };
      });

      const discount = updates.discount_percent !== undefined
        ? updates.discount_percent
        : existing.discount_percent;

      updates.total_amount = calcTotal(normalisedItems, discount);
    } else if (discount_percent !== undefined) {
      // Recalculate total with existing items and new discount
      const { data: existingItems } = await supabase
        .from('quote_items')
        .select('total')
        .eq('quote_id', existing.id);

      updates.total_amount = calcTotal(existingItems || [], parseFloat(discount_percent));
    }

    let updatedQuote = existing;
    if (Object.keys(updates).length > 0) {
      const { data, error } = await supabase
        .from('quotes')
        .update(updates)
        .eq('id', req.params.id)
        .select('*')
        .single();

      if (error) throw error;
      updatedQuote = data;
    }

    // Replace items if provided
    if (normalisedItems !== undefined) {
      await supabase.from('quote_items').delete().eq('quote_id', req.params.id);
      if (normalisedItems.length > 0) {
        await supabase
          .from('quote_items')
          .insert(normalisedItems.map((i) => ({ ...i, quote_id: req.params.id })));
      }
    }

    // Return fresh data
    const { data: finalItems } = await supabase
      .from('quote_items')
      .select('*')
      .eq('quote_id', req.params.id);

    return res.json({ quote: { ...updatedQuote, items: finalItems || [] } });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /quotes/:id/send — mark as sent, generate tracking token
// ---------------------------------------------------------------------------
router.post('/:id/send', async (req, res, next) => {
  try {
    const { data: existing, error: fetchError } = await supabase
      .from('quotes')
      .select('id, status, tracking_token, user_id')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .maybeSingle();

    if (fetchError) throw fetchError;
    if (!existing) return res.status(404).json({ error: 'Quote not found' });

    const tracking_token = existing.tracking_token || uuidv4();
    const appUrl = process.env.APP_URL || 'https://yourdomain.com';
    const trackingUrl = `${appUrl}/q/${tracking_token}`;

    const { data: quote, error } = await supabase
      .from('quotes')
      .update({
        status:          'sent',
        sent_at:         new Date().toISOString(),
        tracking_token,
      })
      .eq('id', req.params.id)
      .select('*')
      .single();

    if (error) throw error;

    await logEvent(req.params.id, req.userId, 'quote_sent', {});
    await logFirstEvent(req.userId, 'first_quote_sent', { method: 'full' });

    return res.json({ quote, tracking_url: trackingUrl });
  } catch (err) {
    next(err);
  }
});

// ---------------------------------------------------------------------------
// POST /quotes/:id/convert-to-invoice — create invoice from quote
// ---------------------------------------------------------------------------
router.post('/:id/convert-to-invoice', async (req, res, next) => {
  try {
    const { data: quote, error: quoteError } = await supabase
      .from('quotes')
      .select('*')
      .eq('id', req.params.id)
      .eq('user_id', req.userId)
      .maybeSingle();

    if (quoteError) throw quoteError;
    if (!quote) return res.status(404).json({ error: 'Quote not found' });

    const {
      due_date,
      invoice_number,
    } = req.body;

    // Generate invoice number if not provided: INV-YYYYMMDD-XXXX
    let invNumber = invoice_number;
    if (!invNumber) {
      const today = new Date();
      const datePart = today.toISOString().slice(0, 10).replace(/-/g, '');
      const rand = Math.floor(1000 + Math.random() * 9000);
      invNumber = `INV-${datePart}-${rand}`;
    }

    // Create invoice
    const { data: invoice, error: invError } = await supabase
      .from('invoices')
      .insert({
        user_id:        req.userId,
        client_id:      quote.client_id,
        quote_id:       quote.id,
        invoice_number: invNumber,
        issued_at:      new Date().toISOString().slice(0, 10),
        due_date:       due_date || null,
        total_amount:   quote.total_amount,
        status:         'unpaid',
      })
      .select('*')
      .single();

    if (invError) throw invError;

    // Update quote status to 'accepted'
    await supabase
      .from('quotes')
      .update({ status: 'accepted' })
      .eq('id', quote.id);

    return res.status(201).json({ invoice });
  } catch (err) {
    next(err);
  }
});

module.exports = router;
