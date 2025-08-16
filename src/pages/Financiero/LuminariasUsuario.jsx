import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import Icon from '../../components/UI/Icon';
import LoadingSpinner from '../../components/UI/LoadingSpinner';
import Modal from '../../components/UI/Modal';
import VirtualizedTable from '../../components/UI/VirtualizedTable';
import './LuminariasUsuario.scss';

/**
 * Gestión de Luminarias para Usuario
 * Muestra balance, formas de obtener, historial de transacciones
 */
const LuminariasUsuario = ({ userType }) => {
  const [luminariasData, setLuminariasData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showPurchaseModal, setShowPurchaseModal] = useState(false);
  const [showSendModal, setShowSendModal] = useState(false);
  const [selectedPackage, setSelectedPackage] = useState(null);

  useEffect(() => {
    loadLuminariasData();
  }, []);

  const loadLuminariasData = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/financiero/luminarias');
      if (response.ok) {
        const data = await response.json();
        setLuminariasData(data);
      }
    } catch (error) {
      console.error('Error cargando datos de Luminarias:', error);
    } finally {
      setLoading(false);
    }
  };

  // Paquetes de compra de Luminarias
  const purchasePackages = [
    {
      id: 'basic',
      name: 'Paquete Básico',
      luminarias: 1000,
      price: 4.99,
      bonus: 0,
      popular: false
    },
    {
      id: 'premium',
      name: 'Paquete Premium',
      luminarias: 2500,
      price: 9.99,
      bonus: 250,
      popular: true
    },
    {
      id: 'mega',
      name: 'Mega Paquete',
      luminarias: 5000,
      price: 19.99,
      bonus: 750,
      popular: false
    },
    {
      id: 'ultimate',
      name: 'Paquete Ultimate',
      luminarias: 10000,
      price: 34.99,
      bonus: 2000,
      popular: false
    }
  ];

  // Formas de ganar Luminarias
  const earningMethods = [
    {
      id: 'daily',
      name: 'Recompensa Diaria',
      description: 'Inicia sesión diariamente',
      luminarias: '50-100',
      icon: 'calendar',
      available: true
    },
    {
      id: 'games',
      name: 'Jugar Partidas',
      description: 'Gana jugando trivia',
      luminarias: '10-50',
      icon: 'gamepad',
      available: true
    },
    {
      id: 'achievements',
      name: 'Logros',
      description: 'Completa desafíos',
      luminarias: '100-500',
      icon: 'award',
      available: true
    },
    {
      id: 'referrals',
      name: 'Referencias',
      description: 'Invita a amigos',
      luminarias: '200',
      icon: 'users',
      available: true
    },
    {
      id: 'surveys',
      name: 'Encuestas',
      description: 'Participa en estudios',
      luminarias: '25-75',
      icon: 'clipboard',
      available: false
    }
  ];

  // Transacciones recientes
  const recentTransactions = [
    {
      id: 1,
      type: 'earned',
      amount: 50,
      description: 'Partida ganada - Trivia Historia',
      timestamp: '2024-01-15 14:30',
      icon: 'plus-circle'
    },
    {
      id: 2,
      type: 'spent',
      amount: -25,
      description: 'Compra de ayuda - 50/50',
      timestamp: '2024-01-15 12:15',
      icon: 'minus-circle'
    },
    {
      id: 3,
      type: 'earned',
      amount: 100,
      description: 'Recompensa diaria',
      timestamp: '2024-01-15 09:00',
      icon: 'gift'
    },
    {
      id: 4,
      type: 'purchased',
      amount: 1000,
      description: 'Compra de paquete básico',
      timestamp: '2024-01-14 16:45',
      icon: 'shopping-cart'
    }
  ];

  const handlePurchase = (packageData) => {
    setSelectedPackage(packageData);
    setShowPurchaseModal(true);
  };

  const confirmPurchase = async () => {
    try {
      const response = await fetch('/api/financiero/comprar-luminarias', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ packageId: selectedPackage.id })
      });

      if (response.ok) {
        setShowPurchaseModal(false);
        loadLuminariasData(); // Recargar datos
      }
    } catch (error) {
      console.error('Error en compra:', error);
    }
  };

  const mockData = {
    balance: 2450,
    totalEarned: 3650,
    totalSpent: 1200,
    dailyEarnings: 75,
    weeklyEarnings: 425,
    rank: 156
  };

  if (loading) {
    return <LoadingSpinner size="medium" />;
  }

  return (
    <div className="luminarias-usuario">
      {/* Balance principal */}
      <div className="balance-section">
        <div className="balance-card">
          <div className="balance-header">
            <Icon name="coins" size="32" className="balance-icon" />
            <div>
              <h3>Balance de Luminarias</h3>
              <div className="balance-amount">
                {mockData.balance.toLocaleString()}
                <span className="currency">LUM</span>
              </div>
            </div>
          </div>
          
          <div className="balance-stats">
            <div className="stat">
              <span className="label">Ganadas totales:</span>
              <span className="value">{mockData.totalEarned.toLocaleString()}</span>
            </div>
            <div className="stat">
              <span className="label">Gastadas totales:</span>
              <span className="value">{mockData.totalSpent.toLocaleString()}</span>
            </div>
            <div className="stat">
              <span className="label">Ranking:</span>
              <span className="value">#{mockData.rank}</span>
            </div>
          </div>
        </div>

        <div className="earnings-summary">
          <div className="earning-item">
            <Icon name="calendar" size="20" />
            <div>
              <span className="earning-amount">+{mockData.dailyEarnings}</span>
              <span className="earning-label">Hoy</span>
            </div>
          </div>
          <div className="earning-item">
            <Icon name="trending-up" size="20" />
            <div>
              <span className="earning-amount">+{mockData.weeklyEarnings}</span>
              <span className="earning-label">Esta semana</span>
            </div>
          </div>
        </div>
      </div>

      {/* Paquetes de compra */}
      <div className="purchase-section">
        <h4>Comprar Luminarias</h4>
        <div className="packages-grid">
          {purchasePackages.map(pkg => (
            <motion.div
              key={pkg.id}
              className={`package-card ${pkg.popular ? 'popular' : ''}`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {pkg.popular && (
                <div className="popular-badge">
                  <Icon name="star" size="12" />
                  Popular
                </div>
              )}
              
              <div className="package-header">
                <h5>{pkg.name}</h5>
                <div className="package-price">${pkg.price}</div>
              </div>
              
              <div className="package-content">
                <div className="luminarias-amount">
                  <Icon name="coins" size="16" />
                  {pkg.luminarias.toLocaleString()} LUM
                </div>
                
                {pkg.bonus > 0 && (
                  <div className="bonus-amount">
                    <Icon name="gift" size="14" />
                    +{pkg.bonus} bonus
                  </div>
                )}
                
                <div className="total-amount">
                  Total: {(pkg.luminarias + pkg.bonus).toLocaleString()} LUM
                </div>
              </div>
              
              <button
                className="btn btn-primary"
                onClick={() => handlePurchase(pkg)}
              >
                Comprar
              </button>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Formas de ganar */}
      <div className="earning-methods">
        <h4>Formas de Ganar Luminarias</h4>
        <div className="methods-grid">
          {earningMethods.map(method => (
            <motion.div
              key={method.id}
              className={`method-card ${!method.available ? 'disabled' : ''}`}
              whileHover={method.available ? { scale: 1.02 } : {}}
            >
              <Icon name={method.icon} size="24" className="method-icon" />
              <div className="method-content">
                <h5>{method.name}</h5>
                <p>{method.description}</p>
                <div className="method-reward">
                  <Icon name="coins" size="14" />
                  {method.luminarias} LUM
                </div>
              </div>
              {method.available ? (
                <button className="btn btn-outline btn-sm">
                  {method.id === 'daily' ? 'Reclamar' : 'Participar'}
                </button>
              ) : (
                <span className="disabled-label">Próximamente</span>
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Transacciones recientes */}
      <div className="transactions-section">
        <div className="section-header">
          <h4>Transacciones Recientes</h4>
          <button className="btn btn-outline btn-sm">
            Ver Historial Completo
          </button>
        </div>
        
        <div className="transactions-list">
          {recentTransactions.map(transaction => (
            <motion.div
              key={transaction.id}
              className={`transaction-item ${transaction.type}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Icon name={transaction.icon} size="20" className="transaction-icon" />
              <div className="transaction-content">
                <span className="transaction-description">{transaction.description}</span>
                <span className="transaction-time">{transaction.timestamp}</span>
              </div>
              <div className={`transaction-amount ${transaction.amount > 0 ? 'positive' : 'negative'}`}>
                {transaction.amount > 0 ? '+' : ''}{transaction.amount}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Modal de compra */}
      <Modal
        isOpen={showPurchaseModal}
        onClose={() => setShowPurchaseModal(false)}
        title="Confirmar Compra"
        size="medium"
      >
        {selectedPackage && (
          <div className="purchase-confirmation">
            <div className="package-summary">
              <h4>{selectedPackage.name}</h4>
              <div className="package-details">
                <div className="detail-row">
                  <span>Luminarias:</span>
                  <span>{selectedPackage.luminarias.toLocaleString()}</span>
                </div>
                {selectedPackage.bonus > 0 && (
                  <div className="detail-row bonus">
                    <span>Bonus:</span>
                    <span>+{selectedPackage.bonus.toLocaleString()}</span>
                  </div>
                )}
                <div className="detail-row total">
                  <span>Total LUM:</span>
                  <span>{(selectedPackage.luminarias + selectedPackage.bonus).toLocaleString()}</span>
                </div>
                <div className="detail-row price">
                  <span>Precio:</span>
                  <span>${selectedPackage.price}</span>
                </div>
              </div>
            </div>

            <div className="payment-methods">
              <h5>Método de Pago</h5>
              <div className="payment-options">
                <label className="payment-option">
                  <input type="radio" name="payment" value="card" defaultChecked />
                  <Icon name="credit-card" size="16" />
                  <span>Tarjeta de Crédito</span>
                </label>
                <label className="payment-option">
                  <input type="radio" name="payment" value="paypal" />
                  <Icon name="dollar-sign" size="16" />
                  <span>PayPal</span>
                </label>
              </div>
            </div>

            <div className="modal-actions">
              <button
                className="btn btn-secondary"
                onClick={() => setShowPurchaseModal(false)}
              >
                Cancelar
              </button>
              <button
                className="btn btn-success"
                onClick={confirmPurchase}
              >
                <Icon name="credit-card" size="16" />
                Comprar ${selectedPackage.price}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Acciones adicionales */}
      <div className="additional-actions">
        <button
          className="btn btn-outline"
          onClick={() => setShowSendModal(true)}
        >
          <Icon name="send" size="16" />
          Enviar Luminarias
        </button>
        
        <button className="btn btn-outline">
          <Icon name="gift" size="16" />
          Regalar a Amigo
        </button>
        
        <button className="btn btn-outline">
          <Icon name="chart-bar" size="16" />
          Ver Estadísticas
        </button>
      </div>
    </div>
  );
};

export default LuminariasUsuario;