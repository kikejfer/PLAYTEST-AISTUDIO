const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth');
const { 
  getLuminariasData,
  purchaseLuminarias,
  transferLuminarias,
  getTransactionHistory,
  getCreatorEarnings,
  getMarketplaceItems,
  purchaseMarketplaceItem,
  getSubscriptionPlans,
  subscribeToplan,
  processPayment
} = require('../controllers/financieroController');

// Middleware: Autenticación requerida para todas las rutas
router.use(authenticateToken);

// ============ LUMINARIAS - UNIVERSAL ============

/**
 * GET /api/financiero/luminarias
 * Obtener datos de Luminarias del usuario
 */
router.get('/luminarias', async (req, res) => {
  try {
    const luminariasData = await getLuminariasData(req.user.id);
    
    res.json({
      success: true,
      ...luminariasData
    });
  } catch (error) {
    console.error('Error obteniendo datos de Luminarias:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/financiero/comprar-luminarias
 * Comprar paquete de Luminarias
 */
router.post('/comprar-luminarias', async (req, res) => {
  try {
    const { packageId, payment_method = 'card' } = req.body;
    
    if (!packageId) {
      return res.status(400).json({
        success: false,
        message: 'ID del paquete es requerido'
      });
    }

    const purchaseResult = await purchaseLuminarias(req.user.id, {
      packageId,
      payment_method
    });
    
    res.json({
      success: true,
      transaction: purchaseResult.transaction,
      new_balance: purchaseResult.new_balance
    });
  } catch (error) {
    console.error('Error comprando Luminarias:', error);
    res.status(500).json({
      success: false,
      message: 'Error procesando la compra'
    });
  }
});

/**
 * POST /api/financiero/transferir-luminarias
 * Transferir Luminarias a otro usuario
 */
router.post('/transferir-luminarias', async (req, res) => {
  try {
    const { recipient_id, amount, message = '' } = req.body;
    
    if (!recipient_id || !amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'ID del destinatario y cantidad válida son requeridos'
      });
    }

    const transferResult = await transferLuminarias(req.user.id, {
      recipient_id,
      amount: parseInt(amount),
      message
    });
    
    res.json({
      success: true,
      transaction: transferResult.transaction,
      new_balance: transferResult.new_balance
    });
  } catch (error) {
    console.error('Error transfiriendo Luminarias:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error procesando la transferencia'
    });
  }
});

// ============ HISTORIAL DE TRANSACCIONES ============

/**
 * GET /api/financiero/transacciones
 * Obtener historial de transacciones
 */
router.get('/transacciones', async (req, res) => {
  try {
    const {
      page = 1,
      limit = 50,
      type = 'all', // all, earned, spent, purchased, transferred
      since = '',
      until = ''
    } = req.query;

    const filters = {
      type,
      since,
      until
    };

    const result = await getTransactionHistory(req.user.id, {
      page: parseInt(page),
      limit: parseInt(limit),
      filters
    });
    
    res.json({
      success: true,
      ...result
    });
  } catch (error) {
    console.error('Error obteniendo historial de transacciones:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ============ MONETIZACIÓN PARA CREADORES ============

/**
 * GET /api/financiero/creator/earnings
 * Obtener datos de ingresos para creadores
 * Solo accesible para usuarios con rol de creador/profesor
 */
router.get('/creator/earnings', async (req, res) => {
  try {
    // Verificar que el usuario sea creador
    if (!req.user.roles?.includes('profesor') && !req.user.roles?.includes('creador')) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado: Se requiere rol de creador'
      });
    }

    const {
      period = 'month', // day, week, month, quarter, year
      year = new Date().getFullYear(),
      month = new Date().getMonth() + 1
    } = req.query;

    const earningsData = await getCreatorEarnings(req.user.id, {
      period,
      year: parseInt(year),
      month: parseInt(month)
    });
    
    res.json({
      success: true,
      ...earningsData
    });
  } catch (error) {
    console.error('Error obteniendo datos de ingresos:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/financiero/creator/withdraw
 * Solicitar retiro de fondos para creadores
 */
router.post('/creator/withdraw', async (req, res) => {
  try {
    // Verificar que el usuario sea creador
    if (!req.user.roles?.includes('profesor') && !req.user.roles?.includes('creador')) {
      return res.status(403).json({
        success: false,
        message: 'Acceso denegado: Se requiere rol de creador'
      });
    }

    const { 
      amount, 
      withdrawal_method = 'bank_transfer',
      account_details 
    } = req.body;
    
    if (!amount || amount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Cantidad válida es requerida'
      });
    }

    // TODO: Implementar lógica de retiro
    const withdrawalResult = {
      withdrawal_id: `wd_${Date.now()}`,
      amount,
      status: 'pending',
      estimated_processing: '3-5 días hábiles',
      created_at: new Date().toISOString()
    };
    
    res.json({
      success: true,
      withdrawal: withdrawalResult
    });
  } catch (error) {
    console.error('Error procesando retiro:', error);
    res.status(500).json({
      success: false,
      message: 'Error procesando el retiro'
    });
  }
});

// ============ MARKETPLACE ============

/**
 * GET /api/financiero/marketplace
 * Obtener items del marketplace
 */
router.get('/marketplace', async (req, res) => {
  try {
    const {
      category = 'all',
      user_type = 'usuario', // usuario, creador
      page = 1,
      limit = 20
    } = req.query;

    const items = await getMarketplaceItems({
      category,
      user_type,
      page: parseInt(page),
      limit: parseInt(limit)
    });
    
    res.json({
      success: true,
      ...items
    });
  } catch (error) {
    console.error('Error obteniendo items del marketplace:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/financiero/marketplace/purchase
 * Comprar item del marketplace
 */
router.post('/marketplace/purchase', async (req, res) => {
  try {
    const { item_id, payment_method = 'luminarias' } = req.body;
    
    if (!item_id) {
      return res.status(400).json({
        success: false,
        message: 'ID del item es requerido'
      });
    }

    const purchaseResult = await purchaseMarketplaceItem(req.user.id, {
      item_id,
      payment_method
    });
    
    res.json({
      success: true,
      purchase: purchaseResult.purchase,
      new_balance: purchaseResult.new_balance
    });
  } catch (error) {
    console.error('Error comprando item del marketplace:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error procesando la compra'
    });
  }
});

// ============ PLANES Y SUSCRIPCIONES ============

/**
 * GET /api/financiero/subscription/plans
 * Obtener planes de suscripción disponibles
 */
router.get('/subscription/plans', async (req, res) => {
  try {
    const plans = await getSubscriptionPlans();
    
    res.json({
      success: true,
      plans
    });
  } catch (error) {
    console.error('Error obteniendo planes de suscripción:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/financiero/subscription/subscribe
 * Suscribirse a un plan
 */
router.post('/subscription/subscribe', async (req, res) => {
  try {
    const { 
      plan_id, 
      payment_method = 'card',
      billing_cycle = 'monthly' // monthly, yearly
    } = req.body;
    
    if (!plan_id) {
      return res.status(400).json({
        success: false,
        message: 'ID del plan es requerido'
      });
    }

    const subscriptionResult = await subscribeToplan(req.user.id, {
      plan_id,
      payment_method,
      billing_cycle
    });
    
    res.json({
      success: true,
      subscription: subscriptionResult.subscription,
      next_billing_date: subscriptionResult.next_billing_date
    });
  } catch (error) {
    console.error('Error procesando suscripción:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error procesando la suscripción'
    });
  }
});

/**
 * GET /api/financiero/subscription/current
 * Obtener suscripción actual del usuario
 */
router.get('/subscription/current', async (req, res) => {
  try {
    // TODO: Implementar obtención de suscripción actual
    const currentSubscription = {
      plan_name: 'Premium',
      status: 'active',
      next_billing_date: '2024-02-15',
      features: ['Sin anuncios', 'Contenido premium', 'Soporte prioritario']
    };
    
    res.json({
      success: true,
      subscription: currentSubscription
    });
  } catch (error) {
    console.error('Error obteniendo suscripción actual:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// ============ PROCESAMIENTO DE PAGOS ============

/**
 * POST /api/financiero/payment/process
 * Procesar pago genérico
 */
router.post('/payment/process', async (req, res) => {
  try {
    const {
      amount,
      currency = 'USD',
      payment_method,
      description,
      metadata = {}
    } = req.body;
    
    if (!amount || !payment_method) {
      return res.status(400).json({
        success: false,
        message: 'Cantidad y método de pago son requeridos'
      });
    }

    const paymentResult = await processPayment({
      user_id: req.user.id,
      amount,
      currency,
      payment_method,
      description,
      metadata
    });
    
    res.json({
      success: true,
      payment: paymentResult
    });
  } catch (error) {
    console.error('Error procesando pago:', error);
    res.status(500).json({
      success: false,
      message: error.message || 'Error procesando el pago'
    });
  }
});

module.exports = router;